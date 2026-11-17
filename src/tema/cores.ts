/**
 * Paletas de cor do aplicativo.
 *
 * Tudo foi pensado para lembrar uma Bíblia impressa: papel bege/creme,
 * tinta marrom quase preta e pequenos detalhes em dourado suave.
 * Nenhuma cor vibrante, nenhum branco puro, nenhum preto puro.
 */

export type NomeTema = 'claro' | 'creme' | 'escuro';
export type CorDestaque = 'amarelo' | 'verde' | 'azul' | 'rosa';

export const CORES_DESTAQUE: CorDestaque[] = ['amarelo', 'verde', 'azul', 'rosa'];

export const NOMES_DESTAQUE: Record<CorDestaque, string> = {
  amarelo: 'Amarelo',
  verde: 'Verde',
  azul: 'Azul',
  rosa: 'Rosa',
};

export interface Paleta {
  /** Fundo da página (o "papel"). */
  fundo: string;
  /** Superfícies levemente diferentes: menus, células, painéis. */
  superficie: string;
  /** Texto bíblico. */
  texto: string;
  /** Títulos (livros, seções). */
  titulo: string;
  /** Detalhes discretos (ornamentos, marcações). */
  dourado: string;
  /** Textos auxiliares (legendas, contagens). */
  secundario: string;
  /** Numeração dos versículos. */
  numero: string;
  /** Linhas finíssimas de separação. */
  linha: string;
  /** Texto sobre o botão principal. */
  sobreTitulo: string;
  /** Sombra do fundo dos menus. */
  veu: string;
  /** Cores de destaque de versículo (marca-texto). */
  destaques: Record<CorDestaque, string>;
}

export const PALETAS: Record<NomeTema, Paleta> = {
  claro: {
    fundo: '#F5F0E6',
    superficie: '#EBE4D8',
    texto: '#29231E',
    titulo: '#3C2111',
    dourado: '#D4A14A',
    secundario: '#76665A',
    numero: '#8E7A68',
    linha: 'rgba(60, 33, 17, 0.12)',
    sobreTitulo: '#F5F0E6',
    veu: 'rgba(41, 35, 30, 0.18)',
    destaques: {
      amarelo: '#F1DDA0',
      verde: '#D5E2C2',
      azul: '#D2DEE8',
      rosa: '#EDD2CC',
    },
  },
  creme: {
    fundo: '#EBE4D8',
    superficie: '#E1D8C9',
    texto: '#29231E',
    titulo: '#3C2111',
    dourado: '#C9953F',
    secundario: '#6F6054',
    numero: '#857160',
    linha: 'rgba(60, 33, 17, 0.14)',
    sobreTitulo: '#EBE4D8',
    veu: 'rgba(41, 35, 30, 0.2)',
    destaques: {
      amarelo: '#E9D293',
      verde: '#CCDAB8',
      azul: '#C8D5E0',
      rosa: '#E4C7C0',
    },
  },
  escuro: {
    fundo: '#211D1A',
    superficie: '#2C2622',
    texto: '#EAE2D5',
    titulo: '#F0E3CC',
    dourado: '#C9A15A',
    secundario: '#A99D8E',
    numero: '#8F8274',
    linha: 'rgba(234, 226, 213, 0.12)',
    sobreTitulo: '#211D1A',
    veu: 'rgba(0, 0, 0, 0.45)',
    destaques: {
      amarelo: '#5B4A22',
      verde: '#3A4831',
      azul: '#323F4B',
      rosa: '#4E3532',
    },
  },
};
