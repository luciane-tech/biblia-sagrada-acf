/**
 * Raiz do aplicativo: carrega as fontes, abre o SQLite (importando o texto na
 * primeira execução) e as preferências, mantendo a tela de abertura visível até
 * que tudo esteja pronto. Assim a primeira tela já aparece completa.
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { inicializarBancos } from '../src/db/banco';
import {
  carregarPreferencias,
  Preferencias,
  PreferenciasProvider,
  usePreferencias,
} from '../src/contexto/Preferencias';
import { FONTES_PARA_CARREGAR } from '../src/tema/tipografia';
import { PALETAS } from '../src/tema/cores';

SplashScreen.preventAutoHideAsync().catch(() => {});

function comLimiteDeTempo<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolver, rejeitar) => {
    const t = setTimeout(
      () => rejeitar(new Error('O banco de dados local demorou demais para abrir. Recarregue a página.')),
      ms,
    );
    promessa.then(
      (v) => {
        clearTimeout(t);
        resolver(v);
      },
      (e) => {
        clearTimeout(t);
        rejeitar(e);
      },
    );
  });
}

export default function Raiz() {
  const [fontesCarregadas, erroFontes] = useFonts(FONTES_PARA_CARREGAR);
  const [prefs, setPrefs] = useState<Preferencias | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro(null);
    (async () => {
      try {
        // No navegador, o banco local exige isolamento entre origens (COOP/COEP).
        // Sem ele, o SQLite trava em silêncio — melhor explicar do que ficar em branco.
        if (Platform.OS === 'web' && typeof window !== 'undefined' && !window.crossOriginIsolated) {
          throw new Error(
            'Este site foi publicado sem os cabeçalhos COOP/COEP exigidos pelo banco de dados local. Verifique se o arquivo vercel.json está na raiz do repositório.',
          );
        }
        await comLimiteDeTempo(inicializarBancos(), 30000);
        const carregadas = await carregarPreferencias();
        if (ativo) setPrefs(carregadas);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const fontesProntas = fontesCarregadas || erroFontes !== null;
  const pronto = fontesProntas && (prefs !== null || erro !== null);

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync().catch(() => {});
  }, [pronto]);

  if (!pronto) {
    // No celular, a tela de abertura cobre isto; no navegador, evita a página vazia.
    return (
      <View style={[styles.erro, { backgroundColor: PALETAS.claro.fundo }]}>
        <ActivityIndicator color={PALETAS.claro.dourado} />
        <Text style={[styles.carregando, { color: PALETAS.claro.secundario }]}>Carregando…</Text>
      </View>
    );
  }

  if (erro || !prefs) {
    return (
      <View style={[styles.erro, { backgroundColor: PALETAS.claro.fundo }]}>
        <Text style={[styles.erroTitulo, { color: PALETAS.claro.titulo }]}>
          Não foi possível abrir a Bíblia
        </Text>
        <Text style={[styles.erroTexto, { color: PALETAS.claro.secundario }]}>{erro}</Text>
        <Pressable
          onPress={() => setTentativa((t) => t + 1)}
          accessibilityRole="button"
          style={[styles.erroBotao, { borderColor: PALETAS.claro.titulo }]}
        >
          <Text style={{ color: PALETAS.claro.titulo, fontSize: 16 }}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.raiz}>
      <SafeAreaProvider>
        <PreferenciasProvider inicial={prefs}>
          <Navegacao />
        </PreferenciasProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navegacao() {
  const { cores, temaAtivo } = usePreferencias();

  // Evita "piscadas" brancas entre telas e ao girar o aparelho.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(cores.fundo).catch(() => {});
  }, [cores.fundo]);

  return (
    <>
      <StatusBar style={temaAtivo === 'escuro' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  erro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  carregando: { fontSize: 14, marginTop: 12 },
  erroTitulo: { fontSize: 22, marginBottom: 12, textAlign: 'center' },
  erroTexto: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  erroBotao: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 20, paddingVertical: 12 },
});
