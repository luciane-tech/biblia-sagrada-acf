/**
 * Página de leitura — o coração do aplicativo.
 *
 * Princípios:
 * - O texto flui como numa Bíblia impressa: sem cartões, bordas ou caixas.
 * - Numeração dos versículos pequena e discreta.
 * - Controles mínimos, que se recolhem ao rolar e voltam com um toque.
 * - Deslize horizontal troca de capítulo sem atrapalhar a rolagem vertical.
 * - Tocar num versículo abre um menu discreto (copiar, compartilhar,
 *   favoritar, destacar), que some ao concluir a ação.
 * - A posição de leitura é salva para retomar exatamente onde parou.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  GestureResponderEvent,
  ScrollView as RNScrollView,
  Share,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { NA_WEB } from '../../../src/db/banco';

// Celular: ScrollView integrada ao detector de gestos. Navegador: rolagem nativa.
const Rolagem: typeof RNScrollView = NA_WEB
  ? RNScrollView
  : (GHScrollView as unknown as typeof RNScrollView);
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoIcone } from '../../../src/componentes/BotaoIcone';
import { Ornamento } from '../../../src/componentes/Ornamento';
import { MenuVersiculo } from '../../../src/componentes/MenuVersiculo';
import { AvisoDiscreto } from '../../../src/componentes/AvisoDiscreto';
import { useLeitorDeTela } from '../../../src/componentes/useLeitorDeTela';
import { usePreferencias } from '../../../src/contexto/Preferencias';
import {
  capituloAnterior,
  capituloSeguinte,
  formatarReferencia,
  obterLivro,
  PosicaoCapitulo,
} from '../../../src/dados/livros';
import { obterCapitulo, obterInfoTexto, Versiculo } from '../../../src/db/biblia';
import {
  alternarFavorito,
  definirDestaque,
  destaquesDoCapitulo,
  favoritosDoCapitulo,
  obterUltimaLeitura,
  salvarUltimaLeitura,
} from '../../../src/db/usuario';
import { CorDestaque } from '../../../src/tema/cores';
import { ALVO_TOQUE, FONTES, LARGURA_MAXIMA_TEXTO, MARGEM_PAGINA } from '../../../src/tema/tipografia';

const ALTURA_BARRA = 52;
const ALTURA_RODAPE = 56;
const DISTANCIA_DESLIZE = 70;

type RolagemPendente =
  | { tipo: 'topo' }
  | { tipo: 'deslocamento'; y: number }
  | { tipo: 'versiculo'; versiculo: number };

/**
 * Agrupa versículos em parágrafos conforme as marcas da base de texto.
 * Sem marcas no capítulo, cada versículo ocupa sua própria linha.
 */
function agruparEmParagrafos(versiculos: Versiculo[]): Versiculo[][] {
  if (!versiculos.some((v) => v.paragrafo)) return versiculos.map((v) => [v]);
  const grupos: Versiculo[][] = [];
  for (const v of versiculos) {
    if (v.paragrafo || grupos.length === 0) grupos.push([v]);
    else grupos[grupos.length - 1].push(v);
  }
  return grupos;
}

const textoParaCompartilhar = (v: Versiculo, sigla: string) =>
  `“${v.texto}”\n— ${formatarReferencia(v.livro, v.capitulo, v.versiculo)}${sigla ? ` (${sigla})` : ''}`;

export default function Leitura() {
  const params = useLocalSearchParams<{ livro: string; capitulo: string; v?: string }>();
  const livroId = Number(params.livro);
  const capitulo = Number(params.capitulo);
  const alvo = params.v ? Number(params.v) : 0;
  const livro = obterLivro(livroId);

  const { prefs, cores } = usePreferencias();
  const insets = useSafeAreaInsets();
  const leitorDeTela = useLeitorDeTela();

  const [versiculos, setVersiculos] = useState<Versiculo[] | null>(null);
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());
  const [destaques, setDestaques] = useState<Map<number, CorDestaque>>(new Map());
  const [selecionado, setSelecionado] = useState<Versiculo | null>(null);
  const [marcado, setMarcado] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [demonstrativo, setDemonstrativo] = useState(false);
  const [sigla, setSigla] = useState('');
  const [controlesVisiveis, setControlesVisiveis] = useState(true);

  const visibilidade = useRef(new Animated.Value(1)).current;
  const opacidadeTexto = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<RNScrollView>(null);
  const controlesRef = useRef(true);
  const ultimoY = useRef(0);
  const deslocamento = useRef(0);
  const alturaConteudo = useRef(0);
  const rolagemPendente = useRef<RolagemPendente | null>(null);
  const posicoesParagrafos = useRef<number[]>([]);
  const paragrafoDoVersiculo = useRef(new Map<number, number>());
  const posicaoAtual = useRef({ livro: livroId, capitulo });
  posicaoAtual.current = { livro: livroId, capitulo };

  const anterior = capituloAnterior(livroId, capitulo);
  const seguinte = capituloSeguinte(livroId, capitulo);
  const margemSuperior = insets.top + ALTURA_BARRA + 20;

  // ---------- Controles (barras superior e inferior) ----------

  const definirControles = useCallback(
    (visiveis: boolean) => {
      if (controlesRef.current === visiveis) return;
      controlesRef.current = visiveis;
      setControlesVisiveis(visiveis);
      Animated.timing(visibilidade, {
        toValue: visiveis ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [visibilidade],
  );

  // ---------- Posição de rolagem ----------

  const rolarPara = useCallback((y: number) => {
    ultimoY.current = y; // evita que a rolagem programática esconda os controles
    deslocamento.current = y;
    scrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  const aplicarRolagemPendente = useCallback(() => {
    const pendente = rolagemPendente.current;
    if (!pendente) return;
    if (pendente.tipo === 'topo') {
      rolarPara(0);
    } else if (pendente.tipo === 'deslocamento') {
      if (alturaConteudo.current < pendente.y) return; // aguarda o texto ser medido
      rolarPara(pendente.y);
    } else {
      const indice = paragrafoDoVersiculo.current.get(pendente.versiculo);
      if (indice !== undefined) {
        const y = posicoesParagrafos.current[indice];
        if (y === undefined) return; // aguarda a medição do parágrafo
        // deixa o versículo logo abaixo da barra superior, com um pequeno respiro
        rolarPara(Math.max(0, y - 8));
      }
    }
    rolagemPendente.current = null;
  }, [rolarPara]);

  const salvarPosicao = useCallback(() => {
    const { livro: l, capitulo: c } = posicaoAtual.current;
    salvarUltimaLeitura({ livro: l, capitulo: c, deslocamento: deslocamento.current }).catch(() => {});
  }, []);

  // Salva ao sair da tela.
  useEffect(() => () => salvarPosicao(), [salvarPosicao]);

  // ---------- Carregamento do capítulo ----------

  useEffect(() => {
    let ativo = true;
    setSelecionado(null);
    opacidadeTexto.setValue(0);
    posicoesParagrafos.current = [];

    (async () => {
      const [lista, favs, dest, ultima, info] = await Promise.all([
        obterCapitulo(livroId, capitulo),
        favoritosDoCapitulo(livroId, capitulo),
        destaquesDoCapitulo(livroId, capitulo),
        obterUltimaLeitura(),
        obterInfoTexto(),
      ]);
      if (!ativo) return;

      let inicial = 0;
      if (alvo > 0) {
        rolagemPendente.current = { tipo: 'versiculo', versiculo: alvo };
        setMarcado(alvo);
      } else if (
        ultima &&
        ultima.livro === livroId &&
        ultima.capitulo === capitulo &&
        ultima.deslocamento > 0
      ) {
        inicial = ultima.deslocamento;
        rolagemPendente.current = { tipo: 'deslocamento', y: inicial };
        setMarcado(0);
      } else {
        rolagemPendente.current = { tipo: 'topo' };
        setMarcado(0);
      }
      deslocamento.current = inicial;

      setVersiculos(lista);
      setFavoritos(favs);
      setDestaques(dest);
      setDemonstrativo(info.demonstrativo);
      setSigla(info.sigla);
      definirControles(true);
      salvarUltimaLeitura({ livro: livroId, capitulo, deslocamento: inicial }).catch(() => {});

      if (rolagemPendente.current?.tipo === 'topo') aplicarRolagemPendente();
      setTimeout(aplicarRolagemPendente, 120);
      Animated.timing(opacidadeTexto, { toValue: 1, duration: 240, useNativeDriver: true }).start();
    })().catch(() => {
      if (ativo) setVersiculos([]);
    });

    return () => {
      ativo = false;
    };
  }, [livroId, capitulo, alvo, opacidadeTexto, definirControles, aplicarRolagemPendente]);

  // A marcação do versículo vindo da pesquisa/favoritos some sozinha.
  useEffect(() => {
    if (!marcado) return;
    const t = setTimeout(() => setMarcado(0), 2600);
    return () => clearTimeout(t);
  }, [marcado]);

  // ---------- Navegação entre capítulos ----------

  const irPara = useCallback(
    (destino: PosicaoCapitulo | null) => {
      if (!destino) return;
      salvarPosicao();
      router.setParams({ livro: String(destino.livro), capitulo: String(destino.capitulo), v: '' });
    },
    [salvarPosicao],
  );

  const deslizeRef = useRef<(direcao: 1 | -1) => void>(() => {});
  deslizeRef.current = (direcao) => irPara(direcao === 1 ? seguinte : anterior);

  const gestoDeslize = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-30, 30])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
          if (e.translationX <= -DISTANCIA_DESLIZE) deslizeRef.current(1);
          else if (e.translationX >= DISTANCIA_DESLIZE) deslizeRef.current(-1);
        }),
    [],
  );

  // No navegador, o detector de gestos bloqueia a rolagem por toque (touch-action: none).
  // Lá usamos a rolagem nativa do navegador e detectamos o deslize lateral pelos toques.
  const inicioToque = useRef<{ x: number; y: number } | null>(null);
  const aoIniciarToque = (e: GestureResponderEvent) => {
    inicioToque.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
  };
  const aoTerminarToque = (e: GestureResponderEvent) => {
    const inicio = inicioToque.current;
    inicioToque.current = null;
    if (!inicio) return;
    const dx = e.nativeEvent.pageX - inicio.x;
    const dy = e.nativeEvent.pageY - inicio.y;
    if (Math.abs(dx) >= DISTANCIA_DESLIZE && Math.abs(dx) > Math.abs(dy) * 2) {
      deslizeRef.current(dx < 0 ? 1 : -1);
    }
  };

  const envolverDeslize = (rolagem: React.ReactElement) =>
    NA_WEB ? (
      <View style={styles.raiz} onTouchStart={aoIniciarToque} onTouchEnd={aoTerminarToque}>
        {rolagem}
      </View>
    ) : (
      <GestureDetector gesture={gestoDeslize}>{rolagem}</GestureDetector>
    );

  const voltarAoInicio = () => {
    if (router.canDismiss()) router.dismissAll();
    else router.replace('/');
  };

  // ---------- Rolagem ----------

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const y = contentOffset.y;
    const dy = y - ultimoY.current;
    ultimoY.current = y;
    deslocamento.current = y;
    if (!prefs.ocultarControlesAoRolar) return;
    const noFim = y + layoutMeasurement.height >= contentSize.height - 40;
    if (y < 30 || noFim) definirControles(true);
    else if (dy > 8) definirControles(false);
    else if (dy < -14) definirControles(true);
  };

  // ---------- Ações do menu do versículo ----------

  const fecharMenu = () => setSelecionado(null);

  const copiar = async () => {
    if (!selecionado) return;
    await Clipboard.setStringAsync(textoParaCompartilhar(selecionado, sigla));
    fecharMenu();
    setAviso('Versículo copiado');
  };

  const compartilhar = () => {
    if (!selecionado) return;
    const mensagem = textoParaCompartilhar(selecionado, sigla);
    fecharMenu();
    // Navegadores de computador geralmente não têm compartilhamento: copia o texto.
    if (Platform.OS === 'web' && !(typeof navigator !== 'undefined' && 'share' in navigator)) {
      Clipboard.setStringAsync(mensagem)
        .then(() => setAviso('Versículo copiado para compartilhar'))
        .catch(() => {});
      return;
    }
    // aguarda o menu fechar antes de abrir a folha de compartilhamento
    setTimeout(() => Share.share({ message: mensagem }).catch(() => {}), 300);
  };

  const favoritar = async () => {
    if (!selecionado) return;
    const v = selecionado;
    const agora = await alternarFavorito(v);
    setFavoritos((atual) => {
      const novo = new Set(atual);
      if (agora) novo.add(v.versiculo);
      else novo.delete(v.versiculo);
      return novo;
    });
    fecharMenu();
    setAviso(agora ? 'Adicionado aos favoritos' : 'Removido dos favoritos');
  };

  const destacar = async (cor: CorDestaque | null) => {
    if (!selecionado) return;
    const v = selecionado;
    await definirDestaque(v, cor);
    setDestaques((atual) => {
      const novo = new Map(atual);
      if (cor) novo.set(v.versiculo, cor);
      else novo.delete(v.versiculo);
      return novo;
    });
    fecharMenu();
  };

  const terminarAviso = useCallback(() => setAviso(null), []);

  // ---------- Renderização ----------

  const grupos = useMemo(() => agruparEmParagrafos(versiculos ?? []), [versiculos]);
  const mapa = new Map<number, number>();
  grupos.forEach((g, i) => g.forEach((v) => mapa.set(v.versiculo, i)));
  paragrafoDoVersiculo.current = mapa;

  if (!livro || !Number.isInteger(capitulo) || capitulo < 1 || capitulo > livro.capitulos) {
    return (
      <View style={[styles.raiz, styles.centro, { backgroundColor: cores.fundo }]}>
        <Text style={[styles.vazioTitulo, { color: cores.titulo }]}>Referência não encontrada</Text>
        <Pressable onPress={voltarAoInicio} accessibilityRole="button" style={styles.linkFinal}>
          <Text style={[styles.textoLink, { color: cores.secundario }]}>Voltar ao início</Text>
        </Pressable>
      </View>
    );
  }

  const tamanho = prefs.tamanhoFonte;
  const alturaLinha = Math.round(tamanho * prefs.alturaLinha);
  const estiloParagrafo: TextStyle = {
    fontFamily: FONTES.texto,
    fontSize: tamanho,
    lineHeight: alturaLinha,
    color: cores.texto,
    marginBottom: Math.round(alturaLinha * 0.38),
  };
  const estiloNumero: TextStyle = {
    fontFamily: FONTES.interfaceForte,
    fontSize: Math.round(tamanho * 0.62),
    color: cores.numero,
  };
  const sublinhado: TextStyle = {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: cores.dourado,
  };

  const estiloDoVersiculo = (v: Versiculo): TextStyle[] => {
    const estilos: TextStyle[] = [];
    const cor = destaques.get(v.versiculo);
    if (cor) estilos.push({ backgroundColor: cores.destaques[cor] });
    if (selecionado?.versiculo === v.versiculo || marcado === v.versiculo) estilos.push(sublinhado);
    return estilos;
  };

  const numeroDoVersiculo = (v: Versiculo) => (
    <Text style={[estiloNumero, favoritos.has(v.versiculo) && { color: cores.dourado }]}>
      {v.versiculo}
    </Text>
  );

  const rotuloAnterior = anterior
    ? `${obterLivro(anterior.livro)?.abrev} ${anterior.capitulo}`
    : '';
  const rotuloSeguinte = seguinte
    ? `${obterLivro(seguinte.livro)?.abrev} ${seguinte.capitulo}`
    : '';

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      {envolverDeslize(
        <Rolagem
          style={styles.raiz}
          ref={scrollRef}
          onScroll={aoRolar}
          scrollEventThrottle={32}
          onScrollBeginDrag={() => {
            rolagemPendente.current = null;
          }}
          onScrollEndDrag={salvarPosicao}
          onMomentumScrollEnd={salvarPosicao}
          onContentSizeChange={(_, altura) => {
            alturaConteudo.current = altura;
            aplicarRolagemPendente();
          }}
          contentContainerStyle={{
            paddingTop: margemSuperior,
            paddingBottom: insets.bottom + ALTURA_RODAPE + 48,
            paddingHorizontal: MARGEM_PAGINA,
          }}
        >
          <Pressable
            onPress={() => definirControles(!controlesRef.current)}
            accessible={false}
            style={styles.coluna}
          >
            <Animated.View style={{ opacity: opacidadeTexto }}>
              {/* Cabeçalho da página */}
              <Text style={[styles.nomeLivro, { color: cores.titulo }]} accessibilityRole="header">
                {livro.nome}
              </Text>
              <Text style={[styles.numeroCapitulo, { color: cores.secundario }]}>
                Capítulo {capitulo}
              </Text>
              <Ornamento largura={72} espaco={18} />

              {versiculos && versiculos.length === 0 && (
                <View style={styles.vazio}>
                  <Text style={[styles.vazioTitulo, { color: cores.titulo }]}>
                    Este capítulo ainda não está disponível.
                  </Text>
                  <Text style={[styles.vazioTexto, { color: cores.secundario }]}>
                    {demonstrativo
                      ? 'O aplicativo está usando uma base demonstrativa, que não contém a Bíblia completa.'
                      : 'Não foi possível encontrar este capítulo na base instalada.'}
                  </Text>
                </View>
              )}

              {/* Texto bíblico */}
              {grupos.map((grupo, i) => (
                <View
                  key={`${livroId}-${capitulo}-${grupo[0].versiculo}`}
                  onLayout={(e) => {
                    posicoesParagrafos.current[i] = e.nativeEvent.layout.y;
                    if (rolagemPendente.current?.tipo === 'versiculo') aplicarRolagemPendente();
                  }}
                >
                  {leitorDeTela ? (
                    // Com leitor de tela, cada versículo é um elemento próprio e acionável.
                    grupo.map((v) => (
                      <Text
                        key={v.versiculo}
                        onPress={() => setSelecionado(v)}
                        accessibilityRole="button"
                        accessibilityLabel={`Versículo ${v.versiculo}. ${v.texto}`}
                        accessibilityHint="Abre as opções copiar, compartilhar, favoritar e destacar"
                        style={[estiloParagrafo, ...estiloDoVersiculo(v)]}
                      >
                        {numeroDoVersiculo(v)} {v.texto}
                      </Text>
                    ))
                  ) : (
                    <Text style={estiloParagrafo}>
                      {grupo.map((v, j) => (
                        <Text
                          key={v.versiculo}
                          onPress={() => setSelecionado(v)}
                          suppressHighlighting
                          style={estiloDoVersiculo(v)}
                        >
                          {numeroDoVersiculo(v)}
                          {' '}
                          {v.texto}
                          {j < grupo.length - 1 ? ' ' : ''}
                        </Text>
                      ))}
                    </Text>
                  )}
                </View>
              ))}

              {/* Fim do capítulo */}
              {versiculos !== null && (
                <>
                  <Ornamento largura={48} espaco={28} />
                  <View style={styles.botoesFinais}>
                    <Pressable
                      onPress={() => irPara(anterior)}
                      disabled={!anterior}
                      accessibilityRole="button"
                      accessibilityLabel={
                        anterior
                          ? `Voltar para ${formatarReferencia(anterior.livro, anterior.capitulo)}`
                          : 'Sem capítulo anterior'
                      }
                      style={({ pressed }) => [
                        styles.botaoFinal,
                        { borderColor: cores.titulo, opacity: !anterior ? 0.3 : pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Ionicons name="chevron-back" size={18} color={cores.titulo} />
                      <View>
                        <Text style={[styles.rotuloBotaoFinal, { color: cores.titulo }]}>Voltar</Text>
                        <Text style={[styles.refBotaoFinal, { color: cores.secundario }]}>
                          {rotuloAnterior || '—'}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => irPara(seguinte)}
                      disabled={!seguinte}
                      accessibilityRole="button"
                      accessibilityLabel={
                        seguinte
                          ? `Próximo capítulo: ${formatarReferencia(seguinte.livro, seguinte.capitulo)}`
                          : 'Sem próximo capítulo'
                      }
                      style={({ pressed }) => [
                        styles.botaoFinal,
                        styles.botaoFinalPrincipal,
                        {
                          backgroundColor: cores.titulo,
                          borderColor: cores.titulo,
                          opacity: !seguinte ? 0.3 : pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <View style={styles.textoDireita}>
                        <Text style={[styles.rotuloBotaoFinal, { color: cores.sobreTitulo }]}>
                          Próximo
                        </Text>
                        <Text style={[styles.refBotaoFinal, { color: cores.sobreTitulo, opacity: 0.85 }]}>
                          {rotuloSeguinte || '—'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={cores.sobreTitulo} />
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
          </Pressable>
        </Rolagem>,
      )}

      {/* Barra superior */}
      <Animated.View
        pointerEvents={controlesVisiveis ? 'box-none' : 'none'}
        style={[
          styles.barra,
          {
            paddingTop: insets.top,
            backgroundColor: cores.fundo,
            borderBottomColor: cores.linha,
            opacity: visibilidade,
            transform: [
              { translateY: visibilidade.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.barraInterna}>
          <BotaoIcone icone="home-outline" rotulo="Início" aoPressionar={voltarAoInicio} tamanho={20} />
          <Pressable
            onPress={() => router.push('/livros')}
            accessibilityRole="button"
            accessibilityLabel={`${livro.nome} ${capitulo}. Escolher livro e capítulo`}
            style={({ pressed }) => [styles.seletor, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Text style={[styles.textoSeletor, { color: cores.titulo }]} numberOfLines={1}>
              {livro.nome} {capitulo}
            </Text>
            <Ionicons name="chevron-down" size={14} color={cores.secundario} />
          </Pressable>
          <BotaoIcone
            icone="text-outline"
            rotulo="Ajustes de leitura"
            aoPressionar={() => router.push('/configuracoes')}
            tamanho={20}
          />
        </View>
      </Animated.View>

      {/* Barra inferior: capítulo anterior / seguinte — sempre visível */}
      <View
        style={[
          styles.rodape,
          {
            paddingBottom: insets.bottom,
            backgroundColor: cores.fundo,
            borderTopColor: cores.linha,
          },
        ]}
      >
        <Pressable
          onPress={() => irPara(anterior)}
          disabled={!anterior}
          accessibilityRole="button"
          accessibilityLabel={
            anterior ? `Capítulo anterior: ${formatarReferencia(anterior.livro, anterior.capitulo)}` : 'Sem capítulo anterior'
          }
          style={({ pressed }) => [styles.navegacao, { opacity: !anterior ? 0.3 : pressed ? 0.5 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={cores.titulo} />
          <Text style={[styles.textoNavegacao, { color: cores.titulo }]}>Voltar</Text>
        </Pressable>

        <Text style={[styles.posicao, { color: cores.secundario }]}>
          {capitulo} de {livro.capitulos}
        </Text>

        <Pressable
          onPress={() => irPara(seguinte)}
          disabled={!seguinte}
          accessibilityRole="button"
          accessibilityLabel={
            seguinte ? `Próximo capítulo: ${formatarReferencia(seguinte.livro, seguinte.capitulo)}` : 'Sem próximo capítulo'
          }
          style={({ pressed }) => [
            styles.navegacao,
            styles.navegacaoDireita,
            { opacity: !seguinte ? 0.3 : pressed ? 0.5 : 1 },
          ]}
        >
          <Text style={[styles.textoNavegacao, { color: cores.titulo }]}>Próximo</Text>
          <Ionicons name="chevron-forward" size={20} color={cores.titulo} />
        </Pressable>
      </View>

      <AvisoDiscreto
        mensagem={aviso}
        aoTerminar={terminarAviso}
        distanciaInferior={insets.bottom + ALTURA_RODAPE + 16}
      />

      <MenuVersiculo
        visivel={selecionado !== null}
        referencia={
          selecionado
            ? formatarReferencia(selecionado.livro, selecionado.capitulo, selecionado.versiculo)
            : ''
        }
        previa={selecionado?.texto ?? ''}
        favorito={selecionado ? favoritos.has(selecionado.versiculo) : false}
        destaqueAtual={selecionado ? destaques.get(selecionado.versiculo) ?? null : null}
        aoCopiar={copiar}
        aoCompartilhar={compartilhar}
        aoFavoritar={favoritar}
        aoDestacar={destacar}
        aoFechar={fecharMenu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { alignItems: 'center', justifyContent: 'center', padding: 32 },
  coluna: {
    width: '100%',
    maxWidth: LARGURA_MAXIMA_TEXTO,
    alignSelf: 'center',
  },
  nomeLivro: {
    fontFamily: FONTES.titulo,
    fontSize: 30,
    textAlign: 'center',
  },
  numeroCapitulo: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 2,
  },
  vazio: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  vazioTitulo: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 21,
    textAlign: 'center',
    marginBottom: 10,
  },
  vazioTexto: {
    fontFamily: FONTES.interface,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  linkFinal: {
    alignSelf: 'center',
    minHeight: ALVO_TOQUE,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textoLink: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 18,
  },
  barra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barraInterna: {
    height: ALTURA_BARRA,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  seletor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: ALVO_TOQUE,
  },
  textoSeletor: {
    fontFamily: FONTES.titulo,
    fontSize: 21,
  },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navegacao: {
    flex: 1,
    height: ALTURA_RODAPE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navegacaoDireita: {
    justifyContent: 'flex-end',
  },
  textoNavegacao: {
    fontFamily: FONTES.interfaceForte,
    fontSize: 15,
  },
  posicao: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 13,
  },
  botoesFinais: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  botaoFinal: {
    flex: 1,
    minHeight: 60,
    borderWidth: 1.5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  botaoFinalPrincipal: {
    justifyContent: 'flex-end',
  },
  textoDireita: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  rotuloBotaoFinal: {
    fontFamily: FONTES.interfaceForte,
    fontSize: 15,
  },
  refBotaoFinal: {
    fontFamily: FONTES.interface,
    fontSize: 13,
    marginTop: 2,
  },
});
