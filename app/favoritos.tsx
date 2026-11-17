/** Versículos favoritos, guardados localmente no aparelho. */
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Tela } from '../src/componentes/Tela';
import { Cabecalho } from '../src/componentes/Cabecalho';
import { BotaoIcone } from '../src/componentes/BotaoIcone';
import { Ornamento } from '../src/componentes/Ornamento';
import { useCores } from '../src/contexto/Preferencias';
import { formatarReferencia } from '../src/dados/livros';
import { obterVersiculo } from '../src/db/biblia';
import { Favorito, listarFavoritos, removerFavorito } from '../src/db/usuario';
import { rotaLeitura } from '../src/lib/rotas';
import { FONTES, LARGURA_MAXIMA_TEXTO } from '../src/tema/tipografia';

interface ItemFavorito extends Favorito {
  texto: string | null;
}

const chave = (f: Favorito) => `${f.livro}-${f.capitulo}-${f.versiculo}`;

export default function Favoritos() {
  const cores = useCores();
  const [itens, setItens] = useState<ItemFavorito[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        const favoritos = await listarFavoritos();
        const comTexto = await Promise.all(
          favoritos.map(async (f) => ({
            ...f,
            texto: (await obterVersiculo(f.livro, f.capitulo, f.versiculo))?.texto ?? null,
          })),
        );
        if (ativo) setItens(comTexto);
      })().catch(() => ativo && setItens([]));
      return () => {
        ativo = false;
      };
    }, []),
  );

  const remover = async (item: ItemFavorito) => {
    await removerFavorito(item);
    setItens((atual) => (atual ? atual.filter((f) => chave(f) !== chave(item)) : atual));
  };

  const renderizar = ({ item }: { item: ItemFavorito }) => {
    const referencia = formatarReferencia(item.livro, item.capitulo, item.versiculo);
    return (
      <View style={[styles.item, { borderBottomColor: cores.linha }]}>
        <Pressable
          onPress={() => router.push(rotaLeitura(item.livro, item.capitulo, item.versiculo))}
          accessibilityRole="button"
          accessibilityLabel={`${referencia}. ${item.texto ?? ''}`}
          style={({ pressed }) => [styles.conteudoItem, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.referencia, { color: cores.titulo }]}>{referencia}</Text>
          <Text style={[styles.texto, { color: item.texto ? cores.texto : cores.secundario }]}>
            {item.texto ?? 'Texto indisponível na base instalada.'}
          </Text>
        </Pressable>
        <BotaoIcone
          icone="heart"
          rotulo={`Remover ${referencia} dos favoritos`}
          aoPressionar={() => remover(item)}
          cor={cores.dourado}
          tamanho={20}
        />
      </View>
    );
  };

  return (
    <Tela bordas={['top', 'left', 'right']}>
      <Cabecalho titulo="Favoritos" />
      {itens !== null && itens.length === 0 ? (
        <View style={styles.vazio}>
          <Ornamento largura={80} espaco={20} />
          <Text style={[styles.vazioTitulo, { color: cores.titulo }]}>
            Nenhum versículo favorito ainda.
          </Text>
          <Text style={[styles.vazioTexto, { color: cores.secundario }]}>
            Durante a leitura, toque em um versículo e escolha “Favoritar”.
          </Text>
        </View>
      ) : (
        <FlatList
          data={itens ?? []}
          keyExtractor={chave}
          renderItem={renderizar}
          contentContainerStyle={styles.lista}
          style={styles.listaExterna}
        />
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  listaExterna: {
    width: '100%',
    maxWidth: LARGURA_MAXIMA_TEXTO,
    alignSelf: 'center',
  },
  lista: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  conteudoItem: {
    flex: 1,
    paddingRight: 8,
    paddingVertical: 4,
  },
  referencia: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 13,
    marginBottom: 4,
  },
  texto: {
    fontFamily: FONTES.texto,
    fontSize: 16,
    lineHeight: 25,
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  vazioTitulo: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  vazioTexto: {
    fontFamily: FONTES.interface,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
