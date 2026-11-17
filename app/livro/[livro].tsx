/** Grade de capítulos de um livro. */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Tela } from '../../src/componentes/Tela';
import { Cabecalho } from '../../src/componentes/Cabecalho';
import { Ornamento } from '../../src/componentes/Ornamento';
import { useCores } from '../../src/contexto/Preferencias';
import { obterLivro } from '../../src/dados/livros';
import { capitulosDisponiveis } from '../../src/db/biblia';
import { obterUltimaLeitura } from '../../src/db/usuario';
import { rotaLeitura } from '../../src/lib/rotas';
import { FONTES, LARGURA_MAXIMA_TEXTO } from '../../src/tema/tipografia';

const TAMANHO_CELULA = 56;
const ESPACO = 10;

export default function Capitulos() {
  const { livro: parametro } = useLocalSearchParams<{ livro: string }>();
  const livro = obterLivro(Number(parametro));
  const cores = useCores();
  const { width } = useWindowDimensions();
  const [disponiveis, setDisponiveis] = useState<Set<number> | null>(null);
  const [capituloAtual, setCapituloAtual] = useState<number | null>(null);

  useEffect(() => {
    if (!livro) return;
    capitulosDisponiveis(livro.id).then(setDisponiveis);
    obterUltimaLeitura().then((u) => {
      if (u && u.livro === livro.id) setCapituloAtual(u.capitulo);
    });
  }, [livro]);

  if (!livro) {
    return (
      <Tela>
        <Cabecalho titulo="Livro não encontrado" />
      </Tela>
    );
  }

  const larguraUtil = Math.min(width, LARGURA_MAXIMA_TEXTO) - 48;
  const colunas = Math.max(4, Math.floor((larguraUtil + ESPACO) / (TAMANHO_CELULA + ESPACO)));
  const celula = (larguraUtil - ESPACO * (colunas - 1)) / colunas;
  const numeros = Array.from({ length: livro.capitulos }, (_, i) => i + 1);

  return (
    <Tela bordas={['top', 'left', 'right']}>
      <Cabecalho />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={[styles.nome, { color: cores.titulo }]} accessibilityRole="header">
          {livro.nome}
        </Text>
        <Text style={[styles.subtitulo, { color: cores.secundario }]}>
          {livro.capitulos === 1 ? '1 capítulo' : `${livro.capitulos} capítulos`}
        </Text>
        <Ornamento largura={90} espaco={20} />

        <View style={[styles.grade, { width: larguraUtil, gap: ESPACO }]}>
          {numeros.map((n) => {
            const indisponivel = disponiveis !== null && !disponiveis.has(n);
            const atual = n === capituloAtual;
            return (
              <Pressable
                key={n}
                onPress={() => router.push(rotaLeitura(livro.id, n))}
                accessibilityRole="button"
                accessibilityLabel={`Capítulo ${n}${indisponivel ? ', ainda não disponível' : ''}`}
                style={({ pressed }) => [
                  styles.celula,
                  {
                    width: celula,
                    height: Math.min(celula, TAMANHO_CELULA),
                    backgroundColor: cores.superficie,
                    borderColor: atual ? cores.dourado : 'transparent',
                    opacity: pressed ? 0.6 : indisponivel ? 0.45 : 1,
                  },
                ]}
              >
                <Text style={[styles.numero, { color: cores.texto }]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  nome: {
    fontFamily: FONTES.titulo,
    fontSize: 36,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitulo: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 18,
    marginTop: 2,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  celula: {
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  numero: {
    fontFamily: FONTES.texto,
    fontSize: 17,
  },
});
