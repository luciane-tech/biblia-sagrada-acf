import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../contexto/Preferencias';
import { ALVO_TOQUE } from '../tema/tipografia';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Botão de ícone discreto: visualmente pequeno, mas com área de toque
 * de no mínimo 44 × 44 pontos.
 */
export function BotaoIcone({
  icone,
  rotulo,
  aoPressionar,
  cor,
  tamanho = 22,
  desabilitado = false,
  estilo,
}: {
  icone: NomeIcone;
  rotulo: string;
  aoPressionar: () => void;
  cor?: string;
  tamanho?: number;
  desabilitado?: boolean;
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.botao,
        { opacity: desabilitado ? 0.3 : pressed ? 0.5 : 1 },
        estilo,
      ]}
    >
      <Ionicons name={icone} size={tamanho} color={cor ?? cores.titulo} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    minWidth: ALVO_TOQUE,
    minHeight: ALVO_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
