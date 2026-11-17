/** Pesquisa por palavras, frases (entre aspas) e referências (ex.: Jo 3:16). */
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Tela } from '../src/componentes/Tela';
import { BotaoIcone } from '../src/componentes/BotaoIcone';
import { useCores } from '../src/contexto/Preferencias';
import { formatarReferencia } from '../src/dados/livros';
import { LIMITE_RESULTADOS, pesquisarTexto, ResultadoPesquisa, Versiculo } from '../src/db/biblia';
import { descreverReferencia, interpretarReferencia, Referencia } from '../src/lib/referencia';
import { realcarTermos } from '../src/lib/texto';
import { rotaCapitulos, rotaLeitura } from '../src/lib/rotas';
import { ALVO_TOQUE, FONTES, LARGURA_MAXIMA_TEXTO } from '../src/tema/tipografia';

const formatarNumero = (n: number) => n.toLocaleString('pt-BR');

export default function Pesquisa() {
  const cores = useCores();
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState<ResultadoPesquisa | null>(null);
  const [pesquisando, setPesquisando] = useState(false);

  const referencia: Referencia | null = useMemo(() => interpretarReferencia(busca), [busca]);

  // Pesquisa com pequena espera enquanto o usuário digita.
  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) {
      setResultado(null);
      setPesquisando(false);
      return;
    }
    let ativo = true;
    setPesquisando(true);
    const espera = setTimeout(() => {
      pesquisarTexto(termo)
        .then((r) => ativo && setResultado(r))
        .catch(() => ativo && setResultado({ versiculos: [], total: 0, termos: [] }))
        .finally(() => ativo && setPesquisando(false));
    }, 280);
    return () => {
      ativo = false;
      clearTimeout(espera);
    };
  }, [busca]);

  const abrirReferencia = (ref: Referencia) => {
    Keyboard.dismiss();
    if (ref.capitulo) router.push(rotaLeitura(ref.livro.id, ref.capitulo, ref.versiculo));
    else router.push(rotaCapitulos(ref.livro.id));
  };

  const renderizarResultado = ({ item }: { item: Versiculo }) => (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        router.push(rotaLeitura(item.livro, item.capitulo, item.versiculo));
      }}
      accessibilityRole="button"
      accessibilityLabel={`${formatarReferencia(item.livro, item.capitulo, item.versiculo)}. ${item.texto}`}
      style={({ pressed }) => [
        styles.resultado,
        { borderBottomColor: cores.linha, backgroundColor: pressed ? cores.superficie : 'transparent' },
      ]}
    >
      <Text style={[styles.referencia, { color: cores.titulo }]}>
        {formatarReferencia(item.livro, item.capitulo, item.versiculo)}
      </Text>
      <Text style={[styles.textoResultado, { color: cores.texto }]}>
        {realcarTermos(item.texto, resultado?.termos ?? []).map((trecho, i) =>
          trecho.realce ? (
            <Text key={i} style={[styles.realce, { color: cores.titulo }]}>
              {trecho.texto}
            </Text>
          ) : (
            trecho.texto
          ),
        )}
      </Text>
    </Pressable>
  );

  const cabecalhoLista = (
    <View>
      {referencia && (
        <Pressable
          onPress={() => abrirReferencia(referencia)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.cartaoReferencia,
            { backgroundColor: cores.superficie, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="book-outline" size={20} color={cores.dourado} />
          <View style={styles.flex}>
            <Text style={[styles.legenda, { color: cores.secundario }]}>Ir para</Text>
            <Text style={[styles.tituloReferencia, { color: cores.titulo }]}>
              {descreverReferencia(referencia)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={cores.secundario} />
        </Pressable>
      )}
      {resultado && resultado.total > 0 && (
        <Text style={[styles.contagem, { color: cores.secundario }]} accessibilityLiveRegion="polite">
          {resultado.total > LIMITE_RESULTADOS
            ? `Mostrando ${formatarNumero(LIMITE_RESULTADOS)} de ${formatarNumero(resultado.total)} versículos`
            : `${formatarNumero(resultado.total)} ${resultado.total === 1 ? 'versículo' : 'versículos'}`}
        </Text>
      )}
    </View>
  );

  const semResultados =
    !pesquisando && resultado !== null && resultado.total === 0 && !referencia;

  return (
    <Tela bordas={['top', 'left', 'right']}>
      <View style={styles.barra}>
        <BotaoIcone icone="chevron-back" rotulo="Voltar" aoPressionar={() => router.back()} />
        <View style={[styles.campo, { backgroundColor: cores.superficie }]}>
          <Ionicons name="search-outline" size={18} color={cores.secundario} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Palavra, frase ou referência"
            placeholderTextColor={cores.secundario}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => referencia && abrirReferencia(referencia)}
            accessibilityLabel="Pesquisar na Bíblia"
            style={[styles.entrada, { color: cores.texto }]}
            selectionColor={cores.dourado}
          />
          {busca.length > 0 && (
            <BotaoIcone
              icone="close-circle"
              rotulo="Limpar pesquisa"
              aoPressionar={() => setBusca('')}
              cor={cores.secundario}
              tamanho={18}
            />
          )}
        </View>
      </View>

      {busca.trim().length < 2 ? (
        <View style={styles.dicas}>
          <Text style={[styles.dicasTitulo, { color: cores.titulo }]}>Como pesquisar</Text>
          <Text style={[styles.dica, { color: cores.secundario }]}>
            Palavras: <Text style={{ color: cores.texto }}>pastor alma</Text>
          </Text>
          <Text style={[styles.dica, { color: cores.secundario }]}>
            Frase exata, entre aspas: <Text style={{ color: cores.texto }}>"haja luz"</Text>
          </Text>
          <Text style={[styles.dica, { color: cores.secundario }]}>
            Referência: <Text style={{ color: cores.texto }}>Jo 3:16 · Sl 23 · Gênesis</Text>
          </Text>
          <Text style={[styles.dica, { color: cores.secundario }]}>
            Acentos e maiúsculas não fazem diferença.
          </Text>
        </View>
      ) : (
        <FlatList
          data={resultado?.versiculos ?? []}
          keyExtractor={(v) => `${v.livro}-${v.capitulo}-${v.versiculo}`}
          renderItem={renderizarResultado}
          ListHeaderComponent={cabecalhoLista}
          ListEmptyComponent={
            semResultados ? (
              <Text style={[styles.vazio, { color: cores.secundario }]}>
                Nenhum versículo encontrado para “{busca.trim()}”.
              </Text>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.lista}
          style={styles.listaExterna}
          initialNumToRender={12}
        />
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 6,
  },
  campo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingLeft: 12,
    minHeight: ALVO_TOQUE,
  },
  entrada: {
    flex: 1,
    fontFamily: FONTES.interface,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  dicas: {
    paddingHorizontal: 32,
    paddingTop: 32,
    gap: 10,
    width: '100%',
    maxWidth: LARGURA_MAXIMA_TEXTO,
    alignSelf: 'center',
  },
  dicasTitulo: {
    fontFamily: FONTES.titulo,
    fontSize: 22,
    marginBottom: 4,
  },
  dica: {
    fontFamily: FONTES.interface,
    fontSize: 14,
    lineHeight: 21,
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
  cartaoReferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  legenda: {
    fontFamily: FONTES.interface,
    fontSize: 12,
  },
  tituloReferencia: {
    fontFamily: FONTES.titulo,
    fontSize: 21,
  },
  contagem: {
    fontFamily: FONTES.interface,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  resultado: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  referencia: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 13,
    marginBottom: 4,
  },
  textoResultado: {
    fontFamily: FONTES.texto,
    fontSize: 16,
    lineHeight: 25,
  },
  realce: {
    fontFamily: FONTES.textoForte,
  },
  vazio: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 19,
    textAlign: 'center',
    marginTop: 40,
  },
});
