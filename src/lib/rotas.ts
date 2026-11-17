import type { Href } from 'expo-router';

/** Rota da página de leitura; `versiculo` rola até ele e o marca brevemente. */
export function rotaLeitura(livro: number, capitulo: number, versiculo?: number): Href {
  const base = `/leitura/${livro}/${capitulo}`;
  return (versiculo ? `${base}?v=${versiculo}` : base) as Href;
}

export function rotaCapitulos(livro: number): Href {
  return `/livro/${livro}` as Href;
}
