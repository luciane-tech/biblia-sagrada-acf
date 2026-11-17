/** Tela inicial: título, ornamento, "Ler a Bíblia" e "Continuar leitura". */
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Tela } from '../src/componentes/Tela';
import { Ornamento } from '../src/componentes/Ornamento';
import { usePreferencias } from '../src/contexto/Preferencias';
import { obterUltimaLeitura, UltimaLeitura } from '../src/db/usuario';
import { obterInfoTexto } from '../src/db/biblia';
import { formatarReferencia } from '../src/dados/livros';
import { rotaLeitura } from '../src/lib/rotas';
import { ALVO_TOQUE, FONTES } from '../src/tema/tipografia';

// A retomada automática acontece só uma vez, na abertura do aplicativo.
let retomadaAutomaticaFeita = false;

export default function Inicio() {
  const { prefs, cores } = usePreferencias();
  const [ultima, setUltima] = useState<UltimaLeitura | null>(null);
  const [demonstrativo, setDemonstrativo] = useState(false);
  const [traducao, setTraducao] = useState('');
  const [sigla, setSigla] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      Promise.all([obterUltimaLeitura(), obterInfoTexto()]).then(([leitura, info]) => {
        if (!ativo) return;
        setUltima(leitura);
        setDemonstrativo(info.demonstrativo);
        setTraducao(info.traducao);
        setSigla(info.sigla);
        if (!retomadaAutomaticaFeita) {
          retomadaAutomaticaFeita = true;
          if (leitura && prefs.abrirNaUltimaLeitura) {
            router.push(rotaLeitura(leitura.livro, leitura.capitulo));
          }
        }
      });
      return () => {
        ativo = false;
      };
    }, [prefs.abrirNaUltimaLeitura]),
  );

  const continuar = () =>
    router.push(ultima ? rotaLeitura(ultima.livro, ultima.capitulo) : rotaLeitura(1, 1));

  return (
    <Tela>
      <View style={styles.centro}>
        <Text style={[styles.titulo, { color: cores.titulo }]} accessibilityRole="header">
          Bíblia Sagrada
        </Text>
        <Text style={[styles.subtitulo, { color: cores.secundario }]}>{traducao || ' '}</Text>

        <Ornamento largura={140} espaco={28} />

        <View style={styles.botoes}>
          <Pressable
            onPress={() => router.push('/livros')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.botaoPrincipal,
              { backgroundColor: cores.titulo, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.textoPrincipal, { color: cores.sobreTitulo }]}>Ler a Bíblia</Text>
          </Pressable>

          <Pressable
            onPress={continuar}
            accessibilityRole="button"
            accessibilityHint={
              ultima
                ? `Abre ${formatarReferencia(ultima.livro, ultima.capitulo)}`
                : 'Começa em Gênesis 1'
            }
            style={({ pressed }) => [
              styles.botaoSecundario,
              { borderColor: cores.linha, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.textoSecundario, { color: cores.titulo }]}>Continuar leitura</Text>
            <Text style={[styles.legenda, { color: cores.secundario }]}>
              {ultima ? formatarReferencia(ultima.livro, ultima.capitulo) : 'Comece por Gênesis 1'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.rodape}>
        <AtalhoRodape icone="search-outline" rotulo="Pesquisar" destino="/pesquisa" />
        <AtalhoRodape icone="heart-outline" rotulo="Favoritos" destino="/favoritos" />
        <AtalhoRodape icone="text-outline" rotulo="Leitura" destino="/configuracoes" />
      </View>
      {demonstrativo ? (
        <Text style={[styles.aviso, { color: cores.secundario }]}>
          Base de texto demonstrativa · não contém a Bíblia completa
        </Text>
      ) : sigla ? (
        // Crédito exigido pela licença do texto (detalhes em Leitura → Sobre o texto).
        <Text style={[styles.aviso, { color: cores.secundario }]}>
          Texto bíblico: {traducao} ({sigla}) · CC BY 4.0
        </Text>
      ) : null}
    </Tela>
  );
}

function AtalhoRodape({
  icone,
  rotulo,
  destino,
}: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  rotulo: string;
  destino: '/pesquisa' | '/favoritos' | '/configuracoes';
}) {
  const { cores } = usePreferencias();
  return (
    <Pressable
      onPress={() => router.push(destino)}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [styles.atalho, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Ionicons name={icone} size={20} color={cores.titulo} />
      <Text style={[styles.textoAtalho, { color: cores.secundario }]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  titulo: {
    fontFamily: FONTES.titulo,
    fontSize: 46,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 22,
    marginTop: 4,
    textAlign: 'center',
  },
  botoes: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  botaoPrincipal: {
    minHeight: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPrincipal: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  botaoSecundario: {
    minHeight: 60,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  textoSecundario: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 16,
  },
  legenda: {
    fontFamily: FONTES.tituloItalico,
    fontSize: 16,
    marginTop: 2,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingBottom: 12,
  },
  atalho: {
    minWidth: 72,
    minHeight: ALVO_TOQUE + 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  textoAtalho: {
    fontFamily: FONTES.interface,
    fontSize: 12,
  },
  aviso: {
    fontFamily: FONTES.interface,
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: 8,
    opacity: 0.8,
  },
});
