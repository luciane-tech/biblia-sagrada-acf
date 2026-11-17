/**
 * Dados locais do usuário: favoritos, destaques, preferências e última leitura.
 *
 * - Android/iOS: tabelas no SQLite (usuario.db).
 * - Navegador: um único registro JSON no localStorage. O SQLite persistente do
 *   navegador só aceita uma aba aberta por vez; o localStorage funciona com
 *   várias abas e não depende de recursos especiais do navegador.
 */
import { bancoUsuario, NA_WEB } from './banco';
import { CORES_DESTAQUE, CorDestaque } from '../tema/cores';

export interface RefVersiculo {
  livro: number;
  capitulo: number;
  versiculo: number;
}

export interface Favorito extends RefVersiculo {
  criadoEm: number;
}

interface Destaque extends RefVersiculo {
  cor: CorDestaque;
  criadoEm: number;
}

// ---------- Armazenamento no navegador ----------

interface DadosWeb {
  favoritos: Favorito[];
  destaques: Destaque[];
  preferencias: Record<string, string>;
}

const CHAVE_WEB = 'biblia-acf:usuario:v1';

function lerWeb(): DadosWeb {
  const vazio: DadosWeb = { favoritos: [], destaques: [], preferencias: {} };
  try {
    const texto = globalThis.localStorage?.getItem(CHAVE_WEB);
    if (!texto) return vazio;
    const dados = JSON.parse(texto) as Partial<DadosWeb>;
    return {
      favoritos: Array.isArray(dados.favoritos) ? dados.favoritos : [],
      destaques: Array.isArray(dados.destaques) ? dados.destaques : [],
      preferencias: dados.preferencias && typeof dados.preferencias === 'object' ? dados.preferencias : {},
    };
  } catch {
    return vazio;
  }
}

/** Lê, altera e grava de uma vez (sempre a partir do estado mais recente). */
function alterarWeb(alteracao: (dados: DadosWeb) => void): void {
  const dados = lerWeb();
  alteracao(dados);
  try {
    globalThis.localStorage?.setItem(CHAVE_WEB, JSON.stringify(dados));
  } catch {
    /* armazenamento cheio ou bloqueado: a leitura continua funcionando */
  }
}

const mesmo = (a: RefVersiculo, b: RefVersiculo) =>
  a.livro === b.livro && a.capitulo === b.capitulo && a.versiculo === b.versiculo;

// ---------- Favoritos ----------

/** Alterna o favorito e devolve o novo estado (true = favoritado). */
export async function alternarFavorito(ref: RefVersiculo): Promise<boolean> {
  if (NA_WEB) {
    let favoritado = false;
    alterarWeb((d) => {
      if (d.favoritos.some((f) => mesmo(f, ref))) {
        d.favoritos = d.favoritos.filter((f) => !mesmo(f, ref));
      } else {
        d.favoritos.push({ livro: ref.livro, capitulo: ref.capitulo, versiculo: ref.versiculo, criadoEm: Date.now() });
        favoritado = true;
      }
    });
    return favoritado;
  }
  const db = bancoUsuario();
  const existente = await db.getFirstAsync<{ n: number }>(
    'SELECT 1 AS n FROM favoritos WHERE livro = ? AND capitulo = ? AND versiculo = ?',
    ref.livro,
    ref.capitulo,
    ref.versiculo,
  );
  if (existente) {
    await removerFavorito(ref);
    return false;
  }
  await db.runAsync(
    'INSERT INTO favoritos (livro, capitulo, versiculo, criado_em) VALUES (?, ?, ?, ?)',
    ref.livro,
    ref.capitulo,
    ref.versiculo,
    Date.now(),
  );
  return true;
}

export async function removerFavorito(ref: RefVersiculo): Promise<void> {
  if (NA_WEB) {
    alterarWeb((d) => {
      d.favoritos = d.favoritos.filter((f) => !mesmo(f, ref));
    });
    return;
  }
  await bancoUsuario().runAsync(
    'DELETE FROM favoritos WHERE livro = ? AND capitulo = ? AND versiculo = ?',
    ref.livro,
    ref.capitulo,
    ref.versiculo,
  );
}

export async function favoritosDoCapitulo(livro: number, capitulo: number): Promise<Set<number>> {
  if (NA_WEB) {
    return new Set(
      lerWeb()
        .favoritos.filter((f) => f.livro === livro && f.capitulo === capitulo)
        .map((f) => f.versiculo),
    );
  }
  const linhas = await bancoUsuario().getAllAsync<{ versiculo: number }>(
    'SELECT versiculo FROM favoritos WHERE livro = ? AND capitulo = ?',
    livro,
    capitulo,
  );
  return new Set(linhas.map((l) => l.versiculo));
}

export async function listarFavoritos(): Promise<Favorito[]> {
  if (NA_WEB) {
    return [...lerWeb().favoritos].sort((a, b) => b.criadoEm - a.criadoEm);
  }
  const linhas = await bancoUsuario().getAllAsync<RefVersiculo & { criado_em: number }>(
    'SELECT livro, capitulo, versiculo, criado_em FROM favoritos ORDER BY criado_em DESC',
  );
  return linhas.map((l) => ({
    livro: l.livro,
    capitulo: l.capitulo,
    versiculo: l.versiculo,
    criadoEm: l.criado_em,
  }));
}

// ---------- Destaques ----------

/** Define (ou remove, com `null`) a cor de destaque de um versículo. */
export async function definirDestaque(ref: RefVersiculo, cor: CorDestaque | null): Promise<void> {
  if (NA_WEB) {
    alterarWeb((d) => {
      d.destaques = d.destaques.filter((x) => !mesmo(x, ref));
      if (cor) {
        d.destaques.push({ livro: ref.livro, capitulo: ref.capitulo, versiculo: ref.versiculo, cor, criadoEm: Date.now() });
      }
    });
    return;
  }
  const db = bancoUsuario();
  if (cor === null) {
    await db.runAsync(
      'DELETE FROM destaques WHERE livro = ? AND capitulo = ? AND versiculo = ?',
      ref.livro,
      ref.capitulo,
      ref.versiculo,
    );
    return;
  }
  await db.runAsync(
    `INSERT INTO destaques (livro, capitulo, versiculo, cor, criado_em) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(livro, capitulo, versiculo) DO UPDATE SET cor = excluded.cor`,
    ref.livro,
    ref.capitulo,
    ref.versiculo,
    cor,
    Date.now(),
  );
}

export async function destaquesDoCapitulo(
  livro: number,
  capitulo: number,
): Promise<Map<number, CorDestaque>> {
  const linhas: { versiculo: number; cor: string }[] = NA_WEB
    ? lerWeb().destaques.filter((d) => d.livro === livro && d.capitulo === capitulo)
    : await bancoUsuario().getAllAsync<{ versiculo: number; cor: string }>(
        'SELECT versiculo, cor FROM destaques WHERE livro = ? AND capitulo = ?',
        livro,
        capitulo,
      );
  const mapa = new Map<number, CorDestaque>();
  for (const l of linhas) {
    if ((CORES_DESTAQUE as string[]).includes(l.cor)) mapa.set(l.versiculo, l.cor as CorDestaque);
  }
  return mapa;
}

// ---------- Preferências (chave/valor em JSON) ----------

export async function lerPreferencia<T>(chave: string, padrao: T): Promise<T> {
  let valor: string | undefined;
  if (NA_WEB) {
    valor = lerWeb().preferencias[chave];
  } else {
    const linha = await bancoUsuario().getFirstAsync<{ valor: string }>(
      'SELECT valor FROM preferencias WHERE chave = ?',
      chave,
    );
    valor = linha?.valor;
  }
  if (valor === undefined) return padrao;
  try {
    return JSON.parse(valor) as T;
  } catch {
    return padrao;
  }
}

export async function salvarPreferencia(chave: string, valor: unknown): Promise<void> {
  const texto = JSON.stringify(valor);
  if (NA_WEB) {
    alterarWeb((d) => {
      d.preferencias[chave] = texto;
    });
    return;
  }
  await bancoUsuario().runAsync(
    `INSERT INTO preferencias (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    texto,
  );
}

// ---------- Última leitura ----------

export interface UltimaLeitura {
  livro: number;
  capitulo: number;
  /** Posição de rolagem (px) para retomar exatamente onde parou. */
  deslocamento: number;
}

const CHAVE_ULTIMA = 'ultimaLeitura';

export function obterUltimaLeitura(): Promise<UltimaLeitura | null> {
  return lerPreferencia<UltimaLeitura | null>(CHAVE_ULTIMA, null);
}

export function salvarUltimaLeitura(leitura: UltimaLeitura): Promise<void> {
  return salvarPreferencia(CHAVE_ULTIMA, {
    ...leitura,
    deslocamento: Math.max(0, Math.round(leitura.deslocamento)),
  });
}
