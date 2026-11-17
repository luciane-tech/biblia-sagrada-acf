/**
 * Texto bíblico em memória — usado somente no navegador.
 *
 * O SQLite para navegador reserva um armazenamento que só uma aba pode usar por
 * vez; com duas abas abertas, a segunda falharia. Como o texto já vem junto com
 * o site, basta montá-lo em memória: a Bíblia completa (~31 mil versículos)
 * cabe com folga e a pesquisa linear leva poucos milissegundos.
 */
import { carregarArquivoBiblia, MetaBiblia } from '../dados/fonte';
import { normalizar } from '../lib/texto';

export interface LinhaMemoria {
  livro: number;
  capitulo: number;
  versiculo: number;
  texto: string;
  busca: string;
  paragrafo: number;
}

let linhas: LinhaMemoria[] = [];
let porCapitulo = new Map<string, LinhaMemoria[]>();
let meta: MetaBiblia | null = null;

const chave = (livro: number, capitulo: number) => `${livro}:${capitulo}`;

export function carregarBibliaEmMemoria(): void {
  if (meta) return;
  const arquivo = carregarArquivoBiblia();
  linhas = arquivo.versiculos
    .map(([livro, capitulo, versiculo, texto, paragrafo]) => ({
      livro,
      capitulo,
      versiculo,
      texto,
      busca: normalizar(texto),
      paragrafo: paragrafo ? 1 : 0,
    }))
    .sort((a, b) => a.livro - b.livro || a.capitulo - b.capitulo || a.versiculo - b.versiculo);
  porCapitulo = new Map();
  for (const l of linhas) {
    const k = chave(l.livro, l.capitulo);
    const lista = porCapitulo.get(k);
    if (lista) lista.push(l);
    else porCapitulo.set(k, [l]);
  }
  meta = arquivo.meta;
}

export function capituloEmMemoria(livro: number, capitulo: number): LinhaMemoria[] {
  return porCapitulo.get(chave(livro, capitulo)) ?? [];
}

export function capitulosEmMemoria(livro: number): Set<number> {
  const resultado = new Set<number>();
  for (const k of porCapitulo.keys()) {
    const [l, c] = k.split(':').map(Number);
    if (l === livro) resultado.add(c);
  }
  return resultado;
}

/** Versículos que contêm todos os termos (já normalizados). */
export function pesquisarEmMemoria(termos: string[], limite: number) {
  const encontrados = linhas.filter((l) => termos.every((t) => l.busca.includes(t)));
  return { linhas: encontrados.slice(0, limite), total: encontrados.length };
}

export function metaEmMemoria(): { meta: MetaBiblia | null; total: number } {
  return { meta, total: linhas.length };
}
