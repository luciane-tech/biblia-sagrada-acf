import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { useCores } from '../contexto/Preferencias';
import { FONTES } from '../tema/tipografia';

/**
 * Pequena confirmação ("Versículo copiado") que aparece e some sozinha,
 * sem exigir toque e sem interromper a leitura.
 */
export function AvisoDiscreto({
  mensagem,
  aoTerminar,
  distanciaInferior,
}: {
  mensagem: string | null;
  aoTerminar: () => void;
  distanciaInferior: number;
}) {
  const cores = useCores();
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mensagem) return;
    AccessibilityInfo.announceForAccessibility(mensagem);
    opacidade.setValue(0);
    const animacao = Animated.sequence([
      Animated.timing(opacidade, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(opacidade, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]);
    animacao.start(({ finished }) => finished && aoTerminar());
    return () => animacao.stop();
  }, [mensagem, opacidade, aoTerminar]);

  if (!mensagem) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.caixa,
        { opacity: opacidade, bottom: distanciaInferior, backgroundColor: cores.titulo },
      ]}
    >
      <Text style={[styles.texto, { color: cores.sobreTitulo }]}>{mensagem}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  texto: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 13,
  },
});
