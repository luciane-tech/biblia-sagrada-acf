/**
 * Abertura e preparação dos bancos SQLite.
 *
 * São dois arquivos separados de propósito:
 * - biblia.db  → somente o texto bíblico (pode ser reconstruído a qualquer momento);
 * - usuario.db → favoritos, destaques, preferências e última leitura.
 *
 * Assim, trocar a base demonstrativa pela base licenciada completa nunca apaga
 * os dados do usuário (que são guardados por livro/capítulo/versículo).
 */
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { carregarArquivoBiblia, versaoEmpacotada } from '../dados/fonte';
import { normalizar } from '../lib/texto';

let biblia: SQLite.SQLiteDatabase | null = null;
let usuario: SQLite.SQLiteDatabase | null = null;
let inicializacao: Promise<void> | null = null;

export function bancoBiblia(): SQLite.SQLiteDatabase {
  if (!biblia) throw new Error('O banco da Bíblia ainda não foi aberto.');
  return biblia;
}

export function bancoUsuario(): SQLite.SQLiteDatabase {
  if (!usuario) throw new Error('O banco do usuário ainda não foi aberto.');
  return usuario;
}

/** Abre os bancos, cria as tabelas e importa o texto se necessário. Idempotente. */
export function inicializarBancos(): Promise<void> {
  if (!inicializacao) {
    inicializacao = executarInicializacao().catch((erro) => {
      inicializacao = null; // permite tentar novamente
      throw erro;
    });
  }
  return inicializacao;
}

async function executarInicializacao(): Promise<void> {
  biblia = await SQLite.openDatabaseAsync('biblia.db');
  usuario = await SQLite.openDatabaseAsync('usuario.db');

  // WAL melhora o desempenho no celular; no navegador (WebAssembly) não se aplica.
  if (Platform.OS !== 'web') {
    await biblia.execAsync('PRAGMA journal_mode = WAL;');
    await usuario.execAsync('PRAGMA journal_mode = WAL;');
  }

  await biblia.execAsync(`
    CREATE TABLE IF NOT EXISTS meta (
      chave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS versiculos (
      livro INTEGER NOT NULL,
      capitulo INTEGER NOT NULL,
      versiculo INTEGER NOT NULL,
      texto TEXT NOT NULL,
      texto_busca TEXT NOT NULL,
      paragrafo INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (livro, capitulo, versiculo)
    ) WITHOUT ROWID;
  `);

  await usuario.execAsync(`
    CREATE TABLE IF NOT EXISTS favoritos (
      livro INTEGER NOT NULL,
      capitulo INTEGER NOT NULL,
      versiculo INTEGER NOT NULL,
      criado_em INTEGER NOT NULL,
      PRIMARY KEY (livro, capitulo, versiculo)
    );
    CREATE TABLE IF NOT EXISTS destaques (
      livro INTEGER NOT NULL,
      capitulo INTEGER NOT NULL,
      versiculo INTEGER NOT NULL,
      cor TEXT NOT NULL,
      criado_em INTEGER NOT NULL,
      PRIMARY KEY (livro, capitulo, versiculo)
    );
    CREATE TABLE IF NOT EXISTS preferencias (
      chave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );
  `);

  await importarTextoSeNecessario(biblia);
}

const TAMANHO_LOTE = 150; // 150 linhas × 6 colunas = 900 parâmetros por INSERT

async function importarTextoSeNecessario(db: SQLite.SQLiteDatabase): Promise<void> {
  const atual = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM meta WHERE chave = ?',
    'versaoDados',
  );
  const empacotada = versaoEmpacotada();
  if (atual?.valor === empacotada) return;

  const arquivo = carregarArquivoBiblia();
  if (arquivo.meta.versaoDados !== empacotada) {
    throw new Error(
      `assets/biblia/versao.json (${empacotada}) não corresponde a biblia.json (${arquivo.meta.versaoDados}).`,
    );
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM versiculos');
    const linhas = arquivo.versiculos;
    for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
      const lote = linhas.slice(i, i + TAMANHO_LOTE);
      const marcadores = lote.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const parametros: SQLite.SQLiteBindValue[] = [];
      for (const [livro, capitulo, versiculo, texto, paragrafo] of lote) {
        parametros.push(livro, capitulo, versiculo, texto, normalizar(texto), paragrafo ? 1 : 0);
      }
      await db.runAsync(
        `INSERT OR REPLACE INTO versiculos (livro, capitulo, versiculo, texto, texto_busca, paragrafo) VALUES ${marcadores}`,
        parametros,
      );
    }
    await db.runAsync('DELETE FROM meta');
    const meta = arquivo.meta;
    const pares: [string, string][] = [
      ['traducao', meta.traducao],
      ['sigla', meta.sigla],
      ['demonstrativo', meta.demonstrativo ? '1' : '0'],
      ['fonte', meta.fonte],
      ['licenca', meta.licenca],
      ['totalVersiculos', String(linhas.length)],
      // gravado por último: só marca como concluído se tudo acima deu certo
      ['versaoDados', meta.versaoDados],
    ];
    for (const [chave, valor] of pares) {
      await db.runAsync('INSERT INTO meta (chave, valor) VALUES (?, ?)', chave, valor);
    }
  });
}
