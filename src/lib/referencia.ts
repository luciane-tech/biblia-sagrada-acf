/**
 * Interpretação de referências bíblicas digitadas na pesquisa.
 *
 * Aceita, por exemplo: "Jo 3:16", "joão 3.16", "Sl 23", "1 Co 13:4-7",
 * "Gênesis", "apoc 21:4", "jó 1".
 */
import { LIVROS, Livro, obterLivro } from '../dados/livros';
import { normalizar } from './texto';

export interface Referencia {
  livro: Livro;
  capitulo?: number;
  versiculo?: number;
  versiculoFinal?: number;
}

const compactar = (s: string) => s.replace(/[\s.]+/g, '');

// Índice com acentos (resolve "jó" × "jo") e índice sem acentos.
const indiceExato = new Map<string, number>();
const indiceNormalizado = new Map<string, number>();

for (const livro of LIVROS) {
  const formas = [livro.nome, livro.abrev, ...(livro.apelidos ?? [])];
  for (const forma of formas) {
    const exata = compactar(forma.toLowerCase());
    if (!indiceExato.has(exata)) indiceExato.set(exata, livro.id);
    const semAcento = compactar(normalizar(forma));
    if (!indiceNormalizado.has(semAcento)) indiceNormalizado.set(semAcento, livro.id);
  }
}
// "jo" sem acento é João (convenção usual); "jó" com acento é Jó.
indiceNormalizado.set('jo', 43);
indiceExato.set('jó', 18);

function encontrarLivro(texto: string): Livro | undefined {
  const exata = compactar(texto.toLowerCase());
  const porExata = indiceExato.get(exata);
  if (porExata) return obterLivro(porExata);

  const semAcento = compactar(normalizar(texto));
  const porNormal = indiceNormalizado.get(semAcento);
  if (porNormal) return obterLivro(porNormal);

  // Prefixo único: "deut", "apoc", "ezeq"...
  if (semAcento.length >= 3) {
    const candidatos = LIVROS.filter((l) => compactar(normalizar(l.nome)).startsWith(semAcento));
    if (candidatos.length === 1) return candidatos[0];
  }
  return undefined;
}

const PADRAO = /^([1-3]?\s*[^\d\s:.,-][^\d:,]*?)\s*(?:(\d{1,3})(?:\s*[:.,]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?)?\s*$/;

/** Retorna a referência ou null quando o texto não parece uma referência. */
export function interpretarReferencia(entrada: string): Referencia | null {
  const texto = entrada.trim();
  if (!texto) return null;
  const partes = PADRAO.exec(texto);
  if (!partes) return null;
  const livro = encontrarLivro(partes[1]);
  if (!livro) return null;

  const referencia: Referencia = { livro };
  if (partes[2]) {
    const capitulo = Number(partes[2]);
    if (capitulo < 1 || capitulo > livro.capitulos) return null;
    referencia.capitulo = capitulo;
  }
  if (partes[3]) referencia.versiculo = Number(partes[3]);
  if (partes[4]) {
    const fim = Number(partes[4]);
    if (referencia.versiculo && fim > referencia.versiculo) referencia.versiculoFinal = fim;
  }
  return referencia;
}

export function descreverReferencia(ref: Referencia): string {
  let s = ref.livro.nome;
  if (ref.capitulo) s += ` ${ref.capitulo}`;
  if (ref.capitulo && ref.versiculo) s += `:${ref.versiculo}`;
  if (ref.versiculoFinal) s += `-${ref.versiculoFinal}`;
  return s;
}
