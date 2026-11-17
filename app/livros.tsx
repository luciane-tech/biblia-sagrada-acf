/** Lista dos 66 livros, em duas seções: Antigo e Novo Testamento. */
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Tela } from '../src/componentes/Tela';
import { Cabecalho } from '../src/componentes/Cabecalho';
import { useCores } from '../src/contexto/Preferencias';
import { Livro, LIVROS_AT, LIVROS_NT, obterLivro, Testamento } from '../src/dados/livros';
import { obterUltimaLeitura } from '../src/db/usuario';
import { rotaCapitulos } from '../src/lib/rotas';
import { ALVO_TOQUE, FONTES, LARGURA_MAXIMA_TEXTO } from '../src/tema/tipografia';

export default function ListaDeLivros() {
  const cores = useCores();
  const [secao, setSecao] = useState<Testamento>('AT');
  const [livroAtual, setLivroAtual] = useState<number | null>(null);

  // Abre na seção do livro que está sendo lido.
  useEffect(() => {
    obterUltimaLeitura().then((u) => {
      if (!u) return;
      setLivroAtual(u.livro);
      setSecao(obterLivro(u.livro)?.testamento ?? 'AT');
    });
  }, []);

  const livros = secao === 'AT' ? LIVROS_AT : LIVROS_NT;

  const aba = (valor: Testamento, rotulo: string) => {
    const ativa = secao === valor;
    return (
      <Pressable
        key={valor}
        onPress={() => setSecao(valor)}
        accessibilityRole="tab"
        accessibilityState={{ selected: ativa }}
        style={[styles.aba, { borderBottomColor: ativa ? cores.dourado : 'transparent' }]}
      >
        <Text
          style={[
            styles.textoAba,
            { color: ativa ? cores.titulo : cores.secundario },
          ]}
        >
          {rotulo}
        </Text>
      </Pressable>
    );
  };

  const renderizarLivro = ({ item }: { item: Livro }) => {
    const atual = item.id === livroAtual;
    return (
      <Pressable
        onPress={() => router.push(rotaCapitulos(item.id))}
        accessibilityRole="button"
        accessibilityLabel={`${item.nome}, ${item.capitulos} ${item.capitulos === 1 ? 'capítulo' : 'capítulos'}`}
        style={({ pressed }) => [
          styles.linha,
          { borderBottomColor: cores.linha, backgroundColor: pressed ? cores.superficie : 'transparent' },
        ]}
      >
        <Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text>
        {atual && <View style={[styles.marcador, { backgroundColor: cores.dourado }]} />}
        <Text style={[styles.capitulos, { color: cores.secundario }]}>{item.capitulos}</Text>
      </Pressable>
    );
  };

  return (
    <Tela bordas={['top', 'left', 'right']}>
      <Cabecalho titulo="Livros" />
      <View style={[styles.abas, { borderBottomColor: cores.linha }]} accessibilityRole="tablist">
        {aba('AT', 'Antigo Testamento')}
        {aba('NT', 'Novo Testamento')}
      </View>
      <FlatList
        key={secao}
        data={livros}
        keyExtractor={(l) => String(l.id)}
        renderItem={renderizarLivro}
        contentContainerStyle={styles.lista}
        style={styles.listaExterna}
        initialNumToRender={20}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  abas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 24,
  },
  aba: {
    minHeight: ALVO_TOQUE,
    justifyContent: 'center',
    borderBottomWidth: 2,
    paddingHorizontal: 4,
  },
  textoAba: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 14,
  },
  listaExterna: {
    width: '100%',
    maxWidth: LARGURA_MAXIMA_TEXTO,
    alignSelf: 'center',
  },
  lista: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  nome: {
    flex: 1,
    fontFamily: FONTES.texto,
    fontSize: 18,
  },
  marcador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  capitulos: {
    fontFamily: FONTES.interface,
    fontSize: 13,
    minWidth: 28,
    textAlign: 'right',
  },
});
