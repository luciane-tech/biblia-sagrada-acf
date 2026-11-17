import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useCores } from '../contexto/Preferencias';

/** Detalhe tipográfico muito discreto: filete — losango — filete. */
export function Ornamento({ largura = 120, espaco = 16 }: { largura?: number; espaco?: number }) {
  const cores = useCores();
  return (
    <View
      style={[styles.linha, { width: largura, marginVertical: espaco }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.filete, { backgroundColor: cores.dourado }]} />
      <View style={[styles.losango, { borderColor: cores.dourado }]} />
      <View style={[styles.filete, { backgroundColor: cores.dourado }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  filete: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    opacity: 0.55,
  },
  losango: {
    width: 6,
    height: 6,
    borderWidth: 1,
    marginHorizontal: 10,
    transform: [{ rotate: '45deg' }],
    opacity: 0.85,
  },
});
