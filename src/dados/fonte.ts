/**
 * Fonte do texto bíblico empacotado no aplicativo.
 *
 * Formato de assets/biblia/biblia.json:
 * {
 *   "meta": { traducao, sigla, versaoDados, demonstrativo, fonte, licenca },
 *   "versiculos": [[livro, capitulo, versiculo, "texto", paragrafo?], ...]
 * }
 *
 * - livro: 1 a 66 (ordem de src/dados/livros.ts)
 * - paragrafo (opcional): 1 quando o versículo inicia um novo parágrafo.
 *   Se um capítulo não tiver nenhuma marca, cada versículo é exibido em sua
 *   própria linha, como em muitas edições impressas da ACF.
 *
 * assets/biblia/versao.json guarda apenas { "versaoDados" }. Ele é lido a cada
 * abertura (é minúsculo); o arquivo grande só é carregado quando a versão muda,
 * ou seja, na primeira abertura e após uma atualização do texto.
 */

export interface MetaBiblia {
  traducao: string;
  sigla: string;
  versaoDados: string;
  demonstrativo: boolean;
  fonte: string;
  licenca: string;
}

export type LinhaVersiculo = [number, number, number, string, number?];

export interface ArquivoBiblia {
  meta: MetaBiblia;
  versiculos: LinhaVersiculo[];
}

export function versaoEmpacotada(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const versao = require('../../assets/biblia/versao.json') as { versaoDados: string };
  return versao.versaoDados;
}

/** Carregado sob demanda (require tardio) para não pesar na abertura. */
export function carregarArquivoBiblia(): ArquivoBiblia {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../../assets/biblia/biblia.json') as ArquivoBiblia;
}
