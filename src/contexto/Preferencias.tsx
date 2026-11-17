/**
 * Preferências de leitura (tamanho da fonte, espaçamento, tema...) disponíveis
 * para todas as telas, persistidas no SQLite a cada alteração.
 */
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import { NomeTema, PALETAS, Paleta } from '../tema/cores';
import { lerPreferencia, salvarPreferencia } from '../db/usuario';

export type EscolhaTema = NomeTema | 'sistema';

export interface Preferencias {
  tamanhoFonte: number;
  alturaLinha: number;
  tema: EscolhaTema;
  ocultarControlesAoRolar: boolean;
  abrirNaUltimaLeitura: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanhoFonte: 20,
  alturaLinha: 1.7,
  tema: 'claro',
  ocultarControlesAoRolar: true,
  abrirNaUltimaLeitura: true,
};

export const LIMITES_FONTE = { minimo: 14, maximo: 30 };

export const OPCOES_ALTURA_LINHA = [
  { valor: 1.5, rotulo: 'Compacto' },
  { valor: 1.7, rotulo: 'Confortável' },
  { valor: 1.9, rotulo: 'Amplo' },
];

const CHAVE = 'leitura';

export async function carregarPreferencias(): Promise<Preferencias> {
  const salvas = await lerPreferencia<Partial<Preferencias>>(CHAVE, {});
  return { ...PREFERENCIAS_PADRAO, ...salvas };
}

interface ValorContexto {
  prefs: Preferencias;
  atualizar: (alteracoes: Partial<Preferencias>) => void;
  cores: Paleta;
  temaAtivo: NomeTema;
}

const Contexto = createContext<ValorContexto | null>(null);

export function PreferenciasProvider({
  inicial,
  children,
}: {
  inicial: Preferencias;
  children: ReactNode;
}) {
  const [prefs, setPrefs] = useState<Preferencias>(inicial);
  const esquema = useColorScheme();
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    salvarPreferencia(CHAVE, prefs).catch(() => {
      /* falha ao gravar não deve interromper a leitura */
    });
  }, [prefs]);

  const valor = useMemo<ValorContexto>(() => {
    const temaAtivo: NomeTema =
      prefs.tema === 'sistema' ? (esquema === 'dark' ? 'escuro' : 'claro') : prefs.tema;
    return {
      prefs,
      atualizar: (alteracoes) => setPrefs((atual) => ({ ...atual, ...alteracoes })),
      cores: PALETAS[temaAtivo],
      temaAtivo,
    };
  }, [prefs, esquema]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('usePreferencias precisa estar dentro de PreferenciasProvider.');
  return valor;
}

export function useCores(): Paleta {
  return usePreferencias().cores;
}
