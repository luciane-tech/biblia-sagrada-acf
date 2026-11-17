import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BotaoIcone } from './BotaoIcone';
import { useCores } from '../contexto/Preferencias';
import { FONTES } from '../tema/tipografia';

/** Cabeçalho simples das telas secundárias: voltar, título e ação opcional. */
export function Cabecalho({ titulo, direita }: { titulo?: string; direita?: ReactNode }) {
  const cores = useCores();
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.barra}>
      <BotaoIcone icone="chevron-back" rotulo="Voltar" aoPressionar={voltar} />
      <Text
        style={[styles.titulo, { color: cores.titulo }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {titulo ?? ''}
      </Text>
      <View style={styles.lado}>{direita}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 52,
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTES.titulo,
    fontSize: 23,
  },
  lado: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
});
