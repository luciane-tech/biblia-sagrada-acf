/** Dados locais do usuário: favoritos, destaques, preferências e última leitura. */
import { bancoUsuario } from './banco';
import { CORES_DESTAQUE, CorDestaque } from '../tema/cores';

export interface RefVersiculo {
  livro: number;
  capitulo: number;
  versiculo: number;
}

// ---------- Favoritos ----------

export interface Favorito extends RefVersiculo {
  criadoEm: number;
}

/** Alterna o favorito e devolve o novo estado (true = favoritado). */
export async function alternarFavorito(ref: RefVersiculo): Promise<boolean> {
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
  await bancoUsuario().runAsync(
    'DELETE FROM favoritos WHERE livro = ? AND capitulo = ? AND versiculo = ?',
    ref.livro,
    ref.capitulo,
    ref.versiculo,
  );
}

export async function favoritosDoCapitulo(livro: number, capitulo: number): Promise<Set<number>> {
  const linhas = await bancoUsuario().getAllAsync<{ versiculo: number }>(
    'SELECT versiculo FROM favoritos WHERE livro = ? AND capitulo = ?',
    livro,
    capitulo,
  );
  return new Set(linhas.map((l) => l.versiculo));
}

export async function listarFavoritos(): Promise<Favorito[]> {
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
  const linhas = await bancoUsuario().getAllAsync<{ versiculo: number; cor: string }>(
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
  const linha = await bancoUsuario().getFirstAsync<{ valor: string }>(
    'SELECT valor FROM preferencias WHERE chave = ?',
    chave,
  );
  if (!linha) return padrao;
  try {
    return JSON.parse(linha.valor) as T;
  } catch {
    return padrao;
  }
}

export async function salvarPreferencia(chave: string, valor: unknown): Promise<void> {
  await bancoUsuario().runAsync(
    `INSERT INTO preferencias (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`,
    chave,
    JSON.stringify(valor),
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
