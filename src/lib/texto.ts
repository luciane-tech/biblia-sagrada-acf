/**
 * Utilitários de texto para a pesquisa.
 *
 * A normalização remove acentos e converte para minúsculas caractere a
 * caractere, mantendo SEMPRE o mesmo comprimento do texto original. Isso
 * permite localizar um termo no texto normalizado e realçar exatamente a
 * mesma posição no texto original (com acentos).
 *
 * Não depende de String.prototype.normalize, para ter o mesmo resultado
 * em qualquer motor JavaScript.
 */

const MAPA_ACENTOS: Record<string, string> = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n',
};

/** Minúsculas sem acentos, com o mesmo comprimento da entrada. */
export function normalizar(texto: string): string {
  let saida = '';
  for (let i = 0; i < texto.length; i++) {
    const minuscula = texto[i].toLowerCase();
    const caractere = minuscula.length === 1 ? minuscula : texto[i];
    saida += MAPA_ACENTOS[caractere] ?? caractere;
  }
  return saida;
}

export interface Termos {
  /** Palavras (ou frase única, se entre aspas), já normalizadas. */
  lista: string[];
  /** true quando o usuário digitou a busca entre aspas. */
  fraseExata: boolean;
}

/**
 * Separa a busca em termos. Entre aspas, busca a frase exata;
 * caso contrário, todas as palavras devem aparecer no versículo.
 */
export function extrairTermos(busca: string): Termos {
  const limpa = busca.trim();
  const entreAspas = /^["“”'](.+)["“”']$/.exec(limpa);
  if (entreAspas) {
    const frase = normalizar(entreAspas[1]).replace(/\s+/g, ' ').trim();
    return { lista: frase ? [frase] : [], fraseExata: true };
  }
  const palavras = normalizar(limpa)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 2);
  return { lista: Array.from(new Set(palavras)), fraseExata: false };
}

export interface Trecho {
  texto: string;
  realce: boolean;
}

/** Divide o texto em trechos, marcando as ocorrências dos termos. */
export function realcarTermos(texto: string, termos: string[]): Trecho[] {
  if (termos.length === 0) return [{ texto, realce: false }];
  const base = normalizar(texto);
  const intervalos: [number, number][] = [];
  for (const termo of termos) {
    if (!termo) continue;
    let inicio = base.indexOf(termo);
    while (inicio !== -1) {
      intervalos.push([inicio, inicio + termo.length]);
      inicio = base.indexOf(termo, inicio + termo.length);
    }
  }
  if (intervalos.length === 0) return [{ texto, realce: false }];
  intervalos.sort((a, b) => a[0] - b[0]);
  const unidos: [number, number][] = [];
  for (const atual of intervalos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && atual[0] <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], atual[1]);
    else unidos.push([atual[0], atual[1]]);
  }
  const trechos: Trecho[] = [];
  let cursor = 0;
  for (const [ini, fim] of unidos) {
    if (ini > cursor) trechos.push({ texto: texto.slice(cursor, ini), realce: false });
    trechos.push({ texto: texto.slice(ini, fim), realce: true });
    cursor = fim;
  }
  if (cursor < texto.length) trechos.push({ texto: texto.slice(cursor), realce: false });
  return trechos;
}

/** Escapa curingas do LIKE do SQLite (usado com ESCAPE '\'). */
export function escaparLike(termo: string): string {
  return termo.replace(/[\\%_]/g, (c) => `\\${c}`);
}
