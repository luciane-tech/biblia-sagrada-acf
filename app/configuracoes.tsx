/** Configurações de leitura, com prévia ao vivo do texto. */
import React, { ReactNode, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tela } from '../src/componentes/Tela';
import { Cabecalho } from '../src/componentes/Cabecalho';
import {
  EscolhaTema,
  LIMITES_FONTE,
  OPCOES_ALTURA_LINHA,
  usePreferencias,
} from '../src/contexto/Preferencias';
import { InfoTexto, obterInfoTexto, obterVersiculo } from '../src/db/biblia';
import { PALETAS } from '../src/tema/cores';
import { ALVO_TOQUE, FONTES, LARGURA_MAXIMA_TEXTO } from '../src/tema/tipografia';

const OPCOES_TEMA: { valor: EscolhaTema; rotulo: string; descricao: string }[] = [
  { valor: 'claro', rotulo: 'Bege', descricao: 'Papel bege suave' },
  { valor: 'creme', rotulo: 'Creme', descricao: 'Papel creme, um pouco mais quente' },
  { valor: 'escuro', rotulo: 'Noturno', descricao: 'Para ler com pouca luz' },
  { valor: 'sistema', rotulo: 'Automático', descricao: 'Segue o modo claro/escuro do aparelho' },
];

export default function Configuracoes() {
  const { prefs, atualizar, cores } = usePreferencias();
  const [previa, setPrevia] = useState('No princípio criou Deus os céus e a terra.');
  const [info, setInfo] = useState<InfoTexto | null>(null);

  useEffect(() => {
    obterVersiculo(1, 1, 1).then((v) => v && setPrevia(v.texto));
    obterInfoTexto().then(setInfo);
  }, []);

  const mudarFonte = (delta: number) =>
    atualizar({
      tamanhoFonte: Math.min(
        LIMITES_FONTE.maximo,
        Math.max(LIMITES_FONTE.minimo, prefs.tamanhoFonte + delta),
      ),
    });

  return (
    <Tela bordas={['top', 'left', 'right']}>
      <Cabecalho titulo="Leitura" />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.coluna}>
          {/* Prévia */}
          <View style={[styles.previa, { borderColor: cores.linha }]}>
            <Text
              style={{
                fontFamily: FONTES.texto,
                fontSize: prefs.tamanhoFonte,
                lineHeight: Math.round(prefs.tamanhoFonte * prefs.alturaLinha),
                color: cores.texto,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTES.interfaceMedia,
                  fontSize: Math.round(prefs.tamanhoFonte * 0.6),
                  color: cores.numero,
                }}
              >
                1
              </Text>
              {' '}
              {previa}
            </Text>
          </View>

          <Secao titulo="Tamanho do texto">
            <View style={styles.linhaFonte}>
              <BotaoTamanho
                rotulo="Diminuir texto"
                letra="A"
                tamanhoLetra={15}
                desabilitado={prefs.tamanhoFonte <= LIMITES_FONTE.minimo}
                aoPressionar={() => mudarFonte(-1)}
              />
              <Text
                style={[styles.valorFonte, { color: cores.titulo }]}
                accessibilityLabel={`Tamanho atual ${prefs.tamanhoFonte}`}
              >
                {prefs.tamanhoFonte}
              </Text>
              <BotaoTamanho
                rotulo="Aumentar texto"
                letra="A"
                tamanhoLetra={24}
                desabilitado={prefs.tamanhoFonte >= LIMITES_FONTE.maximo}
                aoPressionar={() => mudarFonte(1)}
              />
            </View>
          </Secao>

          <Secao titulo="Espaçamento entre linhas">
            <View style={styles.chips}>
              {OPCOES_ALTURA_LINHA.map((o) => {
                const ativo = Math.abs(prefs.alturaLinha - o.valor) < 0.01;
                return (
                  <Pressable
                    key={o.valor}
                    onPress={() => atualizar({ alturaLinha: o.valor })}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: ativo }}
                    style={[
                      styles.chip,
                      {
                        borderColor: ativo ? cores.dourado : cores.linha,
                        backgroundColor: ativo ? cores.superficie : 'transparent',
                      },
                    ]}
                  >
                    <Text style={[styles.textoChip, { color: ativo ? cores.titulo : cores.secundario }]}>
                      {o.rotulo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Secao>

          <Secao titulo="Aparência">
            {OPCOES_TEMA.map((o) => {
              const ativo = prefs.tema === o.valor;
              const amostra = o.valor === 'sistema' ? null : PALETAS[o.valor];
              return (
                <Pressable
                  key={o.valor}
                  onPress={() => atualizar({ tema: o.valor })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`${o.rotulo}. ${o.descricao}`}
                  style={[styles.opcao, { borderBottomColor: cores.linha }]}
                >
                  <View
                    style={[
                      styles.amostra,
                      { borderColor: cores.linha, backgroundColor: amostra?.fundo ?? PALETAS.claro.fundo },
                    ]}
                  >
                    {amostra ? (
                      <Text style={{ fontFamily: FONTES.titulo, fontSize: 16, color: amostra.texto }}>Aa</Text>
                    ) : (
                      <View style={[styles.metade, { backgroundColor: PALETAS.escuro.fundo }]} />
                    )}
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.rotuloOpcao, { color: cores.texto }]}>{o.rotulo}</Text>
                    <Text style={[styles.descricao, { color: cores.secundario }]}>{o.descricao}</Text>
                  </View>
                  {ativo && <Ionicons name="checkmark" size={20} color={cores.dourado} />}
                </Pressable>
              );
            })}
          </Secao>

          <Secao titulo="Durante a leitura">
            <LinhaInterruptor
              rotulo="Ocultar controles ao rolar"
              descricao="Toque na página para mostrá-los novamente"
              valor={prefs.ocultarControlesAoRolar}
              aoMudar={(v) => atualizar({ ocultarControlesAoRolar: v })}
            />
            <LinhaInterruptor
              rotulo="Abrir na última leitura"
              descricao="Ao iniciar o aplicativo, retoma de onde parou"
              valor={prefs.abrirNaUltimaLeitura}
              aoMudar={(v) => atualizar({ abrirNaUltimaLeitura: v })}
            />
          </Secao>

          {info && (
            <Secao titulo="Sobre o texto">
              <Text style={[styles.sobre, { color: cores.texto }]}>
                {info.traducao} ({info.sigla})
              </Text>
              <Text style={[styles.sobreDetalhe, { color: info.demonstrativo ? cores.dourado : cores.secundario }]}>
                {info.demonstrativo
                  ? `Base demonstrativa: ${info.totalVersiculos} versículos. Não é o texto integral.`
                  : `${info.totalVersiculos.toLocaleString('pt-BR')} versículos`}
              </Text>
              {!!info.licenca && (
                <Text style={[styles.sobreDetalhe, { color: cores.secundario }]}>{info.licenca}</Text>
              )}
            </Secao>
          )}
        </View>
      </ScrollView>
    </Tela>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { cores } = usePreferencias();
  return (
    <View style={styles.secao}>
      <Text style={[styles.tituloSecao, { color: cores.titulo }]} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

function BotaoTamanho({
  rotulo,
  letra,
  tamanhoLetra,
  desabilitado,
  aoPressionar,
}: {
  rotulo: string;
  letra: string;
  tamanhoLetra: number;
  desabilitado: boolean;
  aoPressionar: () => void;
}) {
  const { cores } = usePreferencias();
  return (
    <Pressable
      onPress={aoPressionar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      style={({ pressed }) => [
        styles.botaoTamanho,
        { borderColor: cores.linha, opacity: desabilitado ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={{ fontFamily: FONTES.texto, fontSize: tamanhoLetra, color: cores.titulo }}>{letra}</Text>
    </Pressable>
  );
}

function LinhaInterruptor({
  rotulo,
  descricao,
  valor,
  aoMudar,
}: {
  rotulo: string;
  descricao: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
}) {
  const { cores } = usePreferencias();
  return (
    <View style={[styles.opcao, { borderBottomColor: cores.linha }]}>
      <View style={styles.flex}>
        <Text style={[styles.rotuloOpcao, { color: cores.texto }]}>{rotulo}</Text>
        <Text style={[styles.descricao, { color: cores.secundario }]}>{descricao}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        accessibilityLabel={rotulo}
        trackColor={{ false: cores.linha, true: cores.dourado }}
        thumbColor={cores.fundo}
        ios_backgroundColor={cores.linha}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  coluna: {
    width: '100%',
    maxWidth: LARGURA_MAXIMA_TEXTO,
    alignSelf: 'center',
  },
  previa: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 20,
    marginTop: 8,
  },
  secao: {
    marginTop: 28,
  },
  tituloSecao: {
    fontFamily: FONTES.titulo,
    fontSize: 21,
    marginBottom: 10,
  },
  linhaFonte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  botaoTamanho: {
    width: ALVO_TOQUE + 8,
    height: ALVO_TOQUE + 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorFonte: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 16,
    minWidth: 28,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
  },
  textoChip: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 14,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 60,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amostra: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  metade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
  },
  rotuloOpcao: {
    fontFamily: FONTES.interfaceMedia,
    fontSize: 15,
  },
  descricao: {
    fontFamily: FONTES.interface,
    fontSize: 13,
    marginTop: 2,
  },
  sobre: {
    fontFamily: FONTES.texto,
    fontSize: 16,
  },
  sobreDetalhe: {
    fontFamily: FONTES.interface,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
});
