import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useCores } from '../contexto/Preferencias';

/** Página com o fundo "papel" e respeito às áreas seguras do aparelho. */
export function Tela({
  children,
  bordas = ['top', 'bottom', 'left', 'right'],
  estilo,
}: {
  children: ReactNode;
  bordas?: Edge[];
  estilo?: ViewStyle;
}) {
  const cores = useCores();
  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <SafeAreaView edges={bordas} style={[styles.raiz, estilo]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
});
