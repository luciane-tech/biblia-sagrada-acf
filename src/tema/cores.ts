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
    fundo: '#FAF7F0',
    superficie: '#EFE8DC',
    texto: '#1A1511',
    titulo: '#2E1A0C',
    dourado: '#B8862E',
    secundario: '#4F4237',
    numero: '#8A6223',
    linha: 'rgba(46, 26, 12, 0.18)',
    sobreTitulo: '#FAF7F0',
    veu: 'rgba(41, 35, 30, 0.18)',
    destaques: {
      amarelo: '#F1DDA0',
      verde: '#D5E2C2',
      azul: '#D2DEE8',
      rosa: '#EDD2CC',
    },
  },
  creme: {
    fundo: '#F1EADD',
    superficie: '#E5DCCB',
    texto: '#1A1511',
    titulo: '#2E1A0C',
    dourado: '#AD7D2A',
    secundario: '#4C4035',
    numero: '#835C20',
    linha: 'rgba(46, 26, 12, 0.18)',
    sobreTitulo: '#F1EADD',
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
