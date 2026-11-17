/**
 * Cânon protestante de 66 livros, na ordem e com os nomes usados na ACF.
 *
 * `capitulos` é a quantidade oficial de capítulos de cada livro; é usada para
 * montar a grade de capítulos e para validar a base de texto importada
 * (veja scripts/validar-biblia.js, que mantém a mesma tabela).
 */

export type Testamento = 'AT' | 'NT';

export interface Livro {
  /** 1 (Gênesis) a 66 (Apocalipse). */
  id: number;
  nome: string;
  /** Abreviação usada em referências curtas. */
  abrev: string;
  testamento: Testamento;
  capitulos: number;
  /** Outras formas aceitas na pesquisa por referência. */
  apelidos?: string[];
}

export const LIVROS: Livro[] = [
  // Antigo Testamento
  { id: 1, nome: 'Gênesis', abrev: 'Gn', testamento: 'AT', capitulos: 50, apelidos: ['gen'] },
  { id: 2, nome: 'Êxodo', abrev: 'Êx', testamento: 'AT', capitulos: 40, apelidos: ['ex', 'exo'] },
  { id: 3, nome: 'Levítico', abrev: 'Lv', testamento: 'AT', capitulos: 27, apelidos: ['lev'] },
  { id: 4, nome: 'Números', abrev: 'Nm', testamento: 'AT', capitulos: 36, apelidos: ['num'] },
  { id: 5, nome: 'Deuteronômio', abrev: 'Dt', testamento: 'AT', capitulos: 34, apelidos: ['deut'] },
  { id: 6, nome: 'Josué', abrev: 'Js', testamento: 'AT', capitulos: 24, apelidos: ['jos'] },
  { id: 7, nome: 'Juízes', abrev: 'Jz', testamento: 'AT', capitulos: 21, apelidos: ['jui'] },
  { id: 8, nome: 'Rute', abrev: 'Rt', testamento: 'AT', capitulos: 4 },
  { id: 9, nome: '1 Samuel', abrev: '1Sm', testamento: 'AT', capitulos: 31, apelidos: ['1sam', '1s'] },
  { id: 10, nome: '2 Samuel', abrev: '2Sm', testamento: 'AT', capitulos: 24, apelidos: ['2sam', '2s'] },
  { id: 11, nome: '1 Reis', abrev: '1Rs', testamento: 'AT', capitulos: 22, apelidos: ['1re', '1r'] },
  { id: 12, nome: '2 Reis', abrev: '2Rs', testamento: 'AT', capitulos: 25, apelidos: ['2re', '2r'] },
  { id: 13, nome: '1 Crônicas', abrev: '1Cr', testamento: 'AT', capitulos: 29, apelidos: ['1cro'] },
  { id: 14, nome: '2 Crônicas', abrev: '2Cr', testamento: 'AT', capitulos: 36, apelidos: ['2cro'] },
  { id: 15, nome: 'Esdras', abrev: 'Ed', testamento: 'AT', capitulos: 10, apelidos: ['esd'] },
  { id: 16, nome: 'Neemias', abrev: 'Ne', testamento: 'AT', capitulos: 13, apelidos: ['nee'] },
  { id: 17, nome: 'Ester', abrev: 'Et', testamento: 'AT', capitulos: 10, apelidos: ['est'] },
  // "jó" com acento é resolvido antes da normalização; sem acento, "jo" = João.
  { id: 18, nome: 'Jó', abrev: 'Jó', testamento: 'AT', capitulos: 42, apelidos: ['job'] },
  { id: 19, nome: 'Salmos', abrev: 'Sl', testamento: 'AT', capitulos: 150, apelidos: ['salmo', 'sal', 'sls'] },
  { id: 20, nome: 'Provérbios', abrev: 'Pv', testamento: 'AT', capitulos: 31, apelidos: ['prov', 'pr'] },
  { id: 21, nome: 'Eclesiastes', abrev: 'Ec', testamento: 'AT', capitulos: 12, apelidos: ['ecl'] },
  { id: 22, nome: 'Cantares', abrev: 'Ct', testamento: 'AT', capitulos: 8, apelidos: ['cantico', 'canticos', 'cantaresdesalomao', 'cant'] },
  { id: 23, nome: 'Isaías', abrev: 'Is', testamento: 'AT', capitulos: 66, apelidos: ['isa'] },
  { id: 24, nome: 'Jeremias', abrev: 'Jr', testamento: 'AT', capitulos: 52, apelidos: ['jer'] },
  { id: 25, nome: 'Lamentações', abrev: 'Lm', testamento: 'AT', capitulos: 5, apelidos: ['lam', 'lamentacoesdejeremias'] },
  { id: 26, nome: 'Ezequiel', abrev: 'Ez', testamento: 'AT', capitulos: 48, apelidos: ['eze'] },
  { id: 27, nome: 'Daniel', abrev: 'Dn', testamento: 'AT', capitulos: 12, apelidos: ['dan'] },
  { id: 28, nome: 'Oséias', abrev: 'Os', testamento: 'AT', capitulos: 14, apelidos: ['ose'] },
  { id: 29, nome: 'Joel', abrev: 'Jl', testamento: 'AT', capitulos: 3 },
  { id: 30, nome: 'Amós', abrev: 'Am', testamento: 'AT', capitulos: 9 },
  { id: 31, nome: 'Obadias', abrev: 'Ob', testamento: 'AT', capitulos: 1, apelidos: ['abdias'] },
  { id: 32, nome: 'Jonas', abrev: 'Jn', testamento: 'AT', capitulos: 4, apelidos: ['jon'] },
  { id: 33, nome: 'Miquéias', abrev: 'Mq', testamento: 'AT', capitulos: 7, apelidos: ['miq'] },
  { id: 34, nome: 'Naum', abrev: 'Na', testamento: 'AT', capitulos: 3 },
  { id: 35, nome: 'Habacuque', abrev: 'Hc', testamento: 'AT', capitulos: 3, apelidos: ['hab'] },
  { id: 36, nome: 'Sofonias', abrev: 'Sf', testamento: 'AT', capitulos: 3, apelidos: ['sof'] },
  { id: 37, nome: 'Ageu', abrev: 'Ag', testamento: 'AT', capitulos: 2 },
  { id: 38, nome: 'Zacarias', abrev: 'Zc', testamento: 'AT', capitulos: 14, apelidos: ['zac'] },
  { id: 39, nome: 'Malaquias', abrev: 'Ml', testamento: 'AT', capitulos: 4, apelidos: ['mal'] },
  // Novo Testamento
  { id: 40, nome: 'Mateus', abrev: 'Mt', testamento: 'NT', capitulos: 28, apelidos: ['mat'] },
  { id: 41, nome: 'Marcos', abrev: 'Mc', testamento: 'NT', capitulos: 16, apelidos: ['mar', 'mr'] },
  { id: 42, nome: 'Lucas', abrev: 'Lc', testamento: 'NT', capitulos: 24, apelidos: ['luc', 'lu'] },
  { id: 43, nome: 'João', abrev: 'Jo', testamento: 'NT', capitulos: 21, apelidos: ['joa'] },
  { id: 44, nome: 'Atos', abrev: 'At', testamento: 'NT', capitulos: 28, apelidos: ['atosdosapostolos'] },
  { id: 45, nome: 'Romanos', abrev: 'Rm', testamento: 'NT', capitulos: 16, apelidos: ['rom'] },
  { id: 46, nome: '1 Coríntios', abrev: '1Co', testamento: 'NT', capitulos: 16, apelidos: ['1cor'] },
  { id: 47, nome: '2 Coríntios', abrev: '2Co', testamento: 'NT', capitulos: 13, apelidos: ['2cor'] },
  { id: 48, nome: 'Gálatas', abrev: 'Gl', testamento: 'NT', capitulos: 6, apelidos: ['gal'] },
  { id: 49, nome: 'Efésios', abrev: 'Ef', testamento: 'NT', capitulos: 6, apelidos: ['efe'] },
  { id: 50, nome: 'Filipenses', abrev: 'Fp', testamento: 'NT', capitulos: 4, apelidos: ['fil', 'flp'] },
  { id: 51, nome: 'Colossenses', abrev: 'Cl', testamento: 'NT', capitulos: 4, apelidos: ['col'] },
  { id: 52, nome: '1 Tessalonicenses', abrev: '1Ts', testamento: 'NT', capitulos: 5, apelidos: ['1tes'] },
  { id: 53, nome: '2 Tessalonicenses', abrev: '2Ts', testamento: 'NT', capitulos: 3, apelidos: ['2tes'] },
  { id: 54, nome: '1 Timóteo', abrev: '1Tm', testamento: 'NT', capitulos: 6, apelidos: ['1tim'] },
  { id: 55, nome: '2 Timóteo', abrev: '2Tm', testamento: 'NT', capitulos: 4, apelidos: ['2tim'] },
  { id: 56, nome: 'Tito', abrev: 'Tt', testamento: 'NT', capitulos: 3 },
  { id: 57, nome: 'Filemom', abrev: 'Fm', testamento: 'NT', capitulos: 1, apelidos: ['filemon', 'flm'] },
  { id: 58, nome: 'Hebreus', abrev: 'Hb', testamento: 'NT', capitulos: 13, apelidos: ['heb'] },
  { id: 59, nome: 'Tiago', abrev: 'Tg', testamento: 'NT', capitulos: 5, apelidos: ['tia'] },
  { id: 60, nome: '1 Pedro', abrev: '1Pe', testamento: 'NT', capitulos: 5, apelidos: ['1ped', '1pd'] },
  { id: 61, nome: '2 Pedro', abrev: '2Pe', testamento: 'NT', capitulos: 3, apelidos: ['2ped', '2pd'] },
  { id: 62, nome: '1 João', abrev: '1Jo', testamento: 'NT', capitulos: 5, apelidos: ['1joa'] },
  { id: 63, nome: '2 João', abrev: '2Jo', testamento: 'NT', capitulos: 1, apelidos: ['2joa'] },
  { id: 64, nome: '3 João', abrev: '3Jo', testamento: 'NT', capitulos: 1, apelidos: ['3joa'] },
  { id: 65, nome: 'Judas', abrev: 'Jd', testamento: 'NT', capitulos: 1, apelidos: ['jud'] },
  { id: 66, nome: 'Apocalipse', abrev: 'Ap', testamento: 'NT', capitulos: 22, apelidos: ['apoc'] },
];

export const LIVROS_AT = LIVROS.filter((l) => l.testamento === 'AT');
export const LIVROS_NT = LIVROS.filter((l) => l.testamento === 'NT');

export function obterLivro(id: number): Livro | undefined {
  return LIVROS[id - 1]?.id === id ? LIVROS[id - 1] : LIVROS.find((l) => l.id === id);
}

export interface PosicaoCapitulo {
  livro: number;
  capitulo: number;
}

/** Próximo capítulo na ordem canônica, atravessando livros. */
export function capituloSeguinte(livro: number, capitulo: number): PosicaoCapitulo | null {
  const atual = obterLivro(livro);
  if (!atual) return null;
  if (capitulo < atual.capitulos) return { livro, capitulo: capitulo + 1 };
  if (livro < LIVROS.length) return { livro: livro + 1, capitulo: 1 };
  return null;
}

/** Capítulo anterior na ordem canônica, atravessando livros. */
export function capituloAnterior(livro: number, capitulo: number): PosicaoCapitulo | null {
  if (capitulo > 1) return { livro, capitulo: capitulo - 1 };
  const anterior = obterLivro(livro - 1);
  if (anterior) return { livro: anterior.id, capitulo: anterior.capitulos };
  return null;
}

export function formatarReferencia(livro: number, capitulo: number, versiculo?: number): string {
  const nome = obterLivro(livro)?.nome ?? `Livro ${livro}`;
  return versiculo ? `${nome} ${capitulo}:${versiculo}` : `${nome} ${capitulo}`;
}
