/**
 * "Instalar no celular" — somente na versão web (PWA).
 *
 * - Android/Chrome/Edge: usa o pedido de instalação do próprio navegador
 *   (evento beforeinstallprompt).
 * - iPhone/iPad (Safari): não existe botão de instalação automática; mostramos
 *   o passo a passo "Compartilhar → Adicionar à Tela de Início".
 * - Já instalado (aberto como app): o botão não aparece.
 */
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencias } from '../contexto/Preferencias';
import { ALVO_TOQUE, FONTES } from '../tema/tipografia';

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const naWeb = Platform.OS === 'web' && typeof window !== 'undefined';

// O navegador dispara o evento cedo; guardamos para usar quando a pessoa tocar no botão.
let eventoGuardado: EventoInstalacao | null = null;
const ouvintes = new Set<() => void>();
if (naWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoGuardado = e as EventoInstalacao;
    ouvintes.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    eventoGuardado = null;
    ouvintes.forEach((f) => f());
  });
}

function jaInstalado(): boolean {
  if (!naWeb) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
}

function ehIOS(): boolean {
  if (!naWeb) return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function BotaoInstalar() {
  const { cores } = usePreferencias();
  const [, atualizar] = useState(0);
  const [instrucoes, setInstrucoes] = useState(false);

  useEffect(() => {
    const f = () => atualizar((n) => n + 1);
    ouvintes.add(f);
    return () => {
      ouvintes.delete(f);
    };
  }, []);

  if (!naWeb || jaInstalado()) return null;

  const instalar = async () => {
    if (eventoGuardado) {
      const evento = eventoGuardado;
      await evento.prompt();
      const escolha = await evento.userChoice.catch(() => null);
      if (escolha?.outcome === 'accepted') eventoGuardado = null;
      atualizar((n) => n + 1);
    } else {
      setInstrucoes(true);
    }
  };

  const ios = ehIOS();

  return (
    <>
      <Pressable
        onPress={instalar}
        accessibilityRole="button"
        accessibilityLabel="Instalar o aplicativo no celular"
        style={({ pressed }) => [styles.botao, { borderColor: cores.linha, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name="download-outline" size={18} color={cores.titulo} />
        <Text style={[styles.textoBotao, { color: cores.titulo }]}>Instalar no celular</Text>
      </Pressable>

      <Modal visible={instrucoes} transparent animationType="fade" onRequestClose={() => setInstrucoes(false)}>
        <Pressable style={[styles.veu, { backgroundColor: cores.veu }]} onPress={() => setInstrucoes(false)} />
        <View style={[styles.painel, { backgroundColor: cores.superficie }]} accessibilityViewIsModal>
          <Text style={[styles.titulo, { color: cores.titulo }]} accessibilityRole="header">
            Instalar no celular
          </Text>
          {ios ? (
            <>
              <Passo n={1} texto="Abra este site no Safari." />
              <Passo n={2} texto="Toque no botão Compartilhar (o quadrado com a seta para cima)." />
              <Passo n={3} texto="Escolha “Adicionar à Tela de Início” e toque em Adicionar." />
            </>
          ) : (
            <>
              <Passo n={1} texto="Abra este site no Chrome (Android) ou no Edge." />
              <Passo n={2} texto="Toque no menu ⋮ do navegador." />
              <Passo n={3} texto="Escolha “Instalar app” ou “Adicionar à tela inicial”." />
            </>
          )}
          <Text style={[styles.nota, { color: cores.secundario }]}>
            O ícone da Bíblia aparece junto com os outros aplicativos e funciona mesmo sem internet.
          </Text>
          <Pressable
            onPress={() => setInstrucoes(false)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.fechar, { backgroundColor: cores.titulo, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.textoFechar, { color: cores.sobreTitulo }]}>Entendi</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function Passo({ n, texto }: { n: number; texto: string }) {
  const { cores } = usePreferencias();
  return (
    <View style={styles.passo}>
      <View style={[styles.numero, { backgroundColor: cores.titulo }]}>
        <Text style={[styles.textoNumero, { color: cores.sobreTitulo }]}>{n}</Text>
      </View>
      <Text style={[styles.textoPasso, { color: cores.texto }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: 22,
    marginBottom: 10,
  },
  textoBotao: { fontFamily: FONTES.interfaceMedia, fontSize: 14 },
  veu: { ...StyleSheet.absoluteFillObject },
  painel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 24,
    gap: 14,
  },
  titulo: { fontFamily: FONTES.titulo, fontSize: 26 },
  passo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numero: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textoNumero: { fontFamily: FONTES.interfaceForte, fontSize: 14 },
  textoPasso: { flex: 1, fontFamily: FONTES.interface, fontSize: 15, lineHeight: 22 },
  nota: { fontFamily: FONTES.interface, fontSize: 13, lineHeight: 19 },
  fechar: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textoFechar: { fontFamily: FONTES.interfaceForte, fontSize: 15 },
});
