import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCores } from '../contexto/Preferencias';
import { CORES_DESTAQUE, CorDestaque, NOMES_DESTAQUE } from '../tema/cores';
import { ALVO_TOQUE, FONTES } from '../tema/tipografia';

type NomeIcone = React.ComponentProps<typeof Ionicons>['name'];

export interface AcoesVersiculo {
  aoCopiar: () => void;
  aoCompartilhar: () => void;
  aoFavoritar: () => void;
  aoDestacar: (cor: CorDestaque | null) => void;
  aoFechar: () => void;
}

/**
 * Menu discreto que sobe da parte inferior ao tocar num versículo.
 * Some assim que uma ação é concluída.
 */
export function MenuVersiculo({
  visivel,
  referencia,
  previa,
  favorito,
  destaqueAtual,
  ...acoes
}: AcoesVersiculo & {
  visivel: boolean;
  referencia: string;
  previa: string;
  favorito: boolean;
  destaqueAtual: CorDestaque | null;
}) {
  const cores = useCores();
  const insets = useSafeAreaInsets();
  const [escolhendoCor, setEscolhendoCor] = useState(false);

  useEffect(() => {
    if (!visivel) setEscolhendoCor(false);
  }, [visivel]);

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={acoes.aoFechar}
    >
      <Pressable
        style={[styles.veu, { backgroundColor: cores.veu }]}
        onPress={acoes.aoFechar}
        accessibilityLabel="Fechar menu do versículo"
      />
      <View
        style={[
          styles.painel,
          { backgroundColor: cores.superficie, paddingBottom: insets.bottom + 14 },
        ]}
        accessibilityViewIsModal
      >
        <View style={[styles.alca, { backgroundColor: cores.linha }]} />
        <Text style={[styles.referencia, { color: cores.titulo }]} accessibilityRole="header">
          {referencia}
        </Text>
        <Text style={[styles.previa, { color: cores.secundario }]} numberOfLines={2}>
          {previa}
        </Text>

        {escolhendoCor ? (
          <View style={styles.linhaCores}>
            {CORES_DESTAQUE.map((cor) => (
              <Pressable
                key={cor}
                onPress={() => acoes.aoDestacar(cor)}
                accessibilityRole="button"
                accessibilityLabel={`Destacar em ${NOMES_DESTAQUE[cor].toLowerCase()}`}
                accessibilityState={{ selected: destaqueAtual === cor }}
                style={styles.alvoCor}
              >
                <View
                  style={[
                    styles.amostraCor,
                    {
                      backgroundColor: cores.destaques[cor],
                      borderColor: destaqueAtual === cor ? cores.dourado : cores.linha,
                      borderWidth: destaqueAtual === cor ? 2 : 1,
                    },
                  ]}
                />
              </Pressable>
            ))}
            {destaqueAtual && (
              <Pressable
                onPress={() => acoes.aoDestacar(null)}
                accessibilityRole="button"
                accessibilityLabel="Remover destaque"
                style={styles.alvoCor}
              >
                <Ionicons name="close-circle-outline" size={30} color={cores.secundario} />
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.linhaAcoes}>
            <Acao icone="copy-outline" rotulo="Copiar" aoPressionar={acoes.aoCopiar} />
            <Acao icone="share-outline" rotulo="Compartilhar" aoPressionar={acoes.aoCompartilhar} />
            <Acao
              icone={favorito ? 'heart' : 'heart-outline'}
              rotulo={favorito ? 'Favorito' : 'Favoritar'}
              aoPressionar={acoes.aoFavoritar}
              ativo={favorito}
            />
            <Acao
              icone="color-wand-outline"
              rotulo="Destacar"
              aoPressionar={() => setEscolhendoCor(true)}
              ativo={destaqueAtual !== null}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

function Acao({
  icone,
  rotulo,
  aoPressionar,
  ativo = false,
}: {
  icone: NomeIcone;
  rotulo: string;
  aoPressionar: () => void;
  ativo?: boolean;
}) {
  const cores = useCores();
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.acao, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Ionicons name={icone} size={22} color={ativo ? cores.dourado : cores.titulo} />
      <Text style={[styles.rotuloAcao, { color: cores.secundario }]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  veu: { flex: 1 },
  painel: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  alca: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  referencia: {
    fontFamily: FONTES.titulo,
    fontSize: 22,
  },
  previa: {
    fontFamily: FONTES.texto,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
    marginBottom: 14,
  },
  linhaAcoes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acao: {
    flex: 1,
    minHeight: ALVO_TOQUE + 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rotuloAcao: {
    fontFamily: FONTES.interface,
    fontSize: 12,
  },
  linhaCores: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: ALVO_TOQUE + 12,
  },
  alvoCor: {
    width: ALVO_TOQUE + 4,
    height: ALVO_TOQUE + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amostraCor: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
