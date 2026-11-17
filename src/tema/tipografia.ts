/**
 * Tipografia.
 *
 * - Lora: texto bíblico (serifada de livro, ótima legibilidade em tela).
 * - Cormorant Garamond: títulos dos livros, com ar de edição clássica.
 * - Inter: elementos de navegação e legendas.
 *
 * As fontes vêm empacotadas no aplicativo (sem download em tempo de execução),
 * então funcionam offline desde a primeira abertura.
 */
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
} from '@expo-google-fonts/lora';
import {
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

export const FONTES_PARA_CARREGAR = {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_500Medium,
  Lora_600SemiBold,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export const FONTES = {
  // Peso médio: traço mais firme e legível em tela, sem perder o ar de livro.
  texto: 'Lora_500Medium',
  textoItalico: 'Lora_400Regular_Italic',
  textoForte: 'Lora_600SemiBold',
  titulo: 'CormorantGaramond_600SemiBold',
  tituloMedio: 'CormorantGaramond_500Medium',
  tituloItalico: 'CormorantGaramond_400Regular_Italic',
  interface: 'Inter_400Regular',
  interfaceMedia: 'Inter_500Medium',
  interfaceForte: 'Inter_600SemiBold',
} as const;

/** Margem lateral da página de leitura (px). */
export const MARGEM_PAGINA = 24;

/** Largura máxima da coluna de texto (tablets), como numa página impressa. */
export const LARGURA_MAXIMA_TEXTO = 640;

/** Altura mínima de qualquer alvo de toque (acessibilidade). */
export const ALVO_TOQUE = 44;
