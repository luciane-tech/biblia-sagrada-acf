/** Consultas ao texto bíblico (somente leitura). */
import { bancoBiblia } from './banco';
import { escaparLike, extrairTermos } from '../lib/texto';

export interface Versiculo {
  livro: number;
  capitulo: number;
  versiculo: number;
  texto: string;
  paragrafo: boolean;
}

interface LinhaVersiculo {
  livro: number;
  capitulo: number;
  versiculo: number;
  texto: string;
  paragrafo: number;
}

const converter = (l: LinhaVersiculo): Versiculo => ({
  livro: l.livro,
  capitulo: l.capitulo,
  versiculo: l.versiculo,
  texto: l.texto,
  paragrafo: l.paragrafo === 1,
});

export async function obterCapitulo(livro: number, capitulo: number): Promise<Versiculo[]> {
  const linhas = await bancoBiblia().getAllAsync<LinhaVersiculo>(
    'SELECT livro, capitulo, versiculo, texto, paragrafo FROM versiculos WHERE livro = ? AND capitulo = ? ORDER BY versiculo',
    livro,
    capitulo,
  );
  return linhas.map(converter);
}

export async function obterVersiculo(
  livro: number,
  capitulo: number,
  versiculo: number,
): Promise<Versiculo | null> {
  const linha = await bancoBiblia().getFirstAsync<LinhaVersiculo>(
    'SELECT livro, capitulo, versiculo, texto, paragrafo FROM versiculos WHERE livro = ? AND capitulo = ? AND versiculo = ?',
    livro,
    capitulo,
    versiculo,
  );
  return linha ? converter(linha) : null;
}

/** Capítulos deste livro que existem na base instalada. */
export async function capitulosDisponiveis(livro: number): Promise<Set<number>> {
  const linhas = await bancoBiblia().getAllAsync<{ capitulo: number }>(
    'SELECT DISTINCT capitulo FROM versiculos WHERE livro = ?',
    livro,
  );
  return new Set(linhas.map((l) => l.capitulo));
}

export interface ResultadoPesquisa {
  versiculos: Versiculo[];
  total: number;
  termos: string[];
}

export const LIMITE_RESULTADOS = 300;

/**
 * Pesquisa sem diferenciar acentos nem maiúsculas.
 * Palavras soltas: todas precisam aparecer. Entre aspas: frase exata.
 */
export async function pesquisarTexto(busca: string): Promise<ResultadoPesquisa> {
  const { lista } = extrairTermos(busca);
  if (lista.length === 0) return { versiculos: [], total: 0, termos: [] };

  const condicoes = lista.map(() => "texto_busca LIKE ? ESCAPE '\\'").join(' AND ');
  const parametros = lista.map((t) => `%${escaparLike(t)}%`);
  const db = bancoBiblia();

  const [contagem, linhas] = await Promise.all([
    db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM versiculos WHERE ${condicoes}`,
      parametros,
    ),
    db.getAllAsync<LinhaVersiculo>(
      `SELECT livro, capitulo, versiculo, texto, paragrafo FROM versiculos WHERE ${condicoes}
       ORDER BY livro, capitulo, versiculo LIMIT ${LIMITE_RESULTADOS}`,
      parametros,
    ),
  ]);
  return { versiculos: linhas.map(converter), total: contagem?.total ?? 0, termos: lista };
}

export interface InfoTexto {
  traducao: string;
  sigla: string;
  demonstrativo: boolean;
  fonte: string;
  licenca: string;
  totalVersiculos: number;
  versaoDados: string;
}

let infoEmCache: InfoTexto | null = null;

export async function obterInfoTexto(): Promise<InfoTexto> {
  if (infoEmCache) return infoEmCache;
  const linhas = await bancoBiblia().getAllAsync<{ chave: string; valor: string }>(
    'SELECT chave, valor FROM meta',
  );
  const m = new Map(linhas.map((l) => [l.chave, l.valor]));
  infoEmCache = {
    traducao: m.get('traducao') ?? 'Almeida Corrigida Fiel',
    sigla: m.get('sigla') ?? 'ACF',
    demonstrativo: m.get('demonstrativo') !== '0',
    fonte: m.get('fonte') ?? '',
    licenca: m.get('licenca') ?? '',
    totalVersiculos: Number(m.get('totalVersiculos') ?? 0),
    versaoDados: m.get('versaoDados') ?? '',
  };
  return infoEmCache;
}
