# Bíblia Sagrada — Almeida Corrigida Fiel

Aplicativo para Android e iPhone (React Native + Expo + TypeScript) que busca a
sensação de ler uma Bíblia impressa de boa qualidade: papel bege, tinta marrom,
tipografia Lora, margens generosas e controles discretos. Funciona 100% offline,
sem cadastro, sem anúncios e sem notificações.

> **Situação do texto:** o aplicativo usa hoje a **Bíblia Livre (BLIVRE)**,
> completa (66 livros, 1.189 capítulos, 31.102 versículos), baseada na Almeida
> de 1819 (Textus Receptus). Licença Creative Commons Atribuição 4.0 Brasil —
> o crédito aparece na tela inicial e em Leitura → Sobre o texto. Fonte:
> eBible.org (`porbr2018_vpl.zip`), texto reproduzido sem alterações.
> Para trocar pela ACF quando a SBTB autorizar, use o conversor da seção 4
> com `--traducao "Almeida Corrigida Fiel" --sigla ACF`.

---

## 1. Arquitetura

```
app/                              Telas (Expo Router: cada arquivo é uma rota)
  _layout.tsx                     Fontes, SQLite, preferências, tela de abertura
  index.tsx                       1. Início
  livros.tsx                      2. Lista de livros (AT / NT)
  livro/[livro].tsx               3. Seleção de capítulos
  leitura/[livro]/[capitulo].tsx  4. Leitura bíblica (?v=16 rola até o versículo)
  pesquisa.tsx                    5. Pesquisa
  favoritos.tsx                   6. Favoritos
  configuracoes.tsx               7. Configurações de leitura
src/
  tema/cores.ts                   Paletas Bege, Creme e Noturno + cores de destaque
  tema/tipografia.ts              Lora, Cormorant Garamond, Inter; margens
  dados/livros.ts                 66 livros, nº de capítulos, abreviações, navegação
  dados/fonte.ts                  Formato e carregamento do texto empacotado
  db/banco.ts                     Abertura dos bancos, esquema e importação
  db/biblia.ts                    Consultas ao texto (capítulo, versículo, pesquisa)
  db/usuario.ts                   Favoritos, destaques, preferências, última leitura
  contexto/Preferencias.tsx       Preferências globais + tema ativo
  componentes/                    Tela, Cabecalho, BotaoIcone, Ornamento,
                                  MenuVersiculo, AvisoDiscreto, useLeitorDeTela
  lib/texto.ts                    Normalização sem acentos e realce de termos
  lib/referencia.ts               Interpretação de "Jo 3:16", "Sl 23", "1 Co 13:4-7"
  lib/rotas.ts                    Construção das rotas
assets/biblia/biblia.json         Texto bíblico (hoje: demonstrativo)
assets/biblia/versao.json         Versão do texto (dispara reimportação)
scripts/converter-biblia.js       TSV/CSV licenciado → biblia.json
scripts/validar-biblia.js         Confere 66 livros / 1.189 capítulos / duplicidades
```

### Dados (SQLite, `expo-sqlite`)

Dois bancos separados, para que trocar o texto nunca apague dados do usuário:

| Banco        | Tabelas                                             |
|--------------|-----------------------------------------------------|
| `biblia.db`  | `versiculos(livro, capitulo, versiculo, texto, texto_busca, paragrafo)`, `meta` |
| `usuario.db` | `favoritos`, `destaques`, `preferencias` (inclui última leitura e posição de rolagem) |

- Na primeira abertura (ou quando `versao.json` muda), o texto empacotado é
  importado em lotes dentro de uma transação. Nas aberturas seguintes, só o
  pequeno `versao.json` é lido — o JSON grande nem é carregado.
- `texto_busca` guarda o texto em minúsculas e sem acentos, para pesquisa
  rápida e tolerante ("joao" encontra "João").
- Favoritos e destaques são guardados por livro/capítulo/versículo.

### Leitura

- Versículos fluem como texto de livro, sem cartões, bordas ou sombras.
- Se a base tiver marcas de parágrafo, os versículos são agrupados em parágrafos;
  senão, cada versículo ocupa uma linha (como em muitas edições impressas da ACF).
- Números dos versículos em tamanho reduzido e cor suave; favoritos têm o número dourado.
- Barras se recolhem ao rolar para baixo e voltam ao rolar para cima ou ao tocar
  numa área livre da página (opção nas configurações).
- Deslize horizontal troca de capítulo (só ativa após ~30 px na horizontal,
  sem interferir na rolagem vertical).
- Toque num versículo → menu discreto: Copiar, Compartilhar, Favoritar, Destacar.
- A posição exata de rolagem é salva; "Continuar leitura" volta ao mesmo ponto.
- Com TalkBack/VoiceOver ativo, cada versículo vira um elemento acionável próprio.

---

## 2. Executar no computador

Pré-requisitos: **Node.js 20 LTS ou superior** (https://nodejs.org) e o
aplicativo **Expo Go** no celular (Play Store / App Store).

```bash
cd biblia-sagrada-acf
npm install
npx expo install --fix
npx expo start
```

`npx expo install --fix` alinha as versões das bibliotecas com o SDK do Expo
instalado. Depois, leia o QR code com o Expo Go (Android) ou com a câmera (iPhone).

Outros comandos:

```bash
npm run typecheck           # verificação de tipos do TypeScript
npm run validar-biblia      # relatório da base de texto
```

---

## 3. Roteiro de testes manuais

1. **Primeira abertura:** a tela de abertura some e aparece o Início com o aviso de base demonstrativa.
2. **Ler a Bíblia → Gênesis → 1:** texto com numeração discreta, margens de 24 px.
3. **Rolar para baixo:** as barras somem; rolar para cima ou tocar na margem: voltam.
4. **Deslizar para a esquerda/direita:** troca para Gênesis 2 / volta para Gênesis 1 (capítulo 2 mostra o aviso de indisponível).
5. **Tocar em um versículo:** Copiar (colar em outro app), Compartilhar, Favoritar (número fica dourado), Destacar (escolher cor; remover).
6. **Pesquisa:** `luz`, `"haja luz"`, `senhor pastor`, `Jo 3:16`, `sl 23`, `jó 1`, `joao` (sem acento).
7. **Favoritos:** o versículo aparece; tocar abre a leitura nele; o coração remove.
8. **Configurações:** tamanho 14–30, espaçamento, Bege/Creme/Noturno/Automático — a prévia muda na hora.
9. **Fechar e reabrir o app:** retoma no mesmo capítulo e posição; preferências mantidas.
10. **Modo avião:** tudo continua funcionando.
11. **Acessibilidade:** ativar TalkBack/VoiceOver e percorrer a leitura e o menu do versículo; aumentar a fonte do sistema.

---

## 4. Integrar o texto completo da ACF (licenciado)

A Almeida Corrigida Fiel é de titularidade da **Sociedade Bíblica Trinitariana do
Brasil (SBTB)**. Antes de publicar, obtenha autorização por escrito para uso do
texto em aplicativo (gratuito/comercial, plataformas, exigências de crédito).
Use **apenas** a base fornecida ou autorizada pela SBTB — não use textos
copiados de sites de terceiros.

Com o arquivo autorizado em mãos (TSV ou CSV com `livro, capitulo, versiculo, texto[, paragrafo]`,
livro numerado de 1 a 66 na ordem canônica):

```bash
node scripts/converter-biblia.js caminho/para/acf.tsv --versao acf-2026-01 --fonte "Sociedade Bíblica Trinitariana do Brasil" --licenca "Texto bíblico ACF © SBTB. Utilizado com permissão."
```

```bash
node scripts/validar-biblia.js --completo
```

O conversor não altera palavras nem pontuação (só remove espaços nas pontas e
padroniza a codificação Unicode). O validador precisa terminar com **OK**:
66 livros, 1.189 capítulos, sem duplicidades. Se a fonte vier em outro formato
(XML, JSON, SQLite), basta exportá-la para TSV com essas colunas.

Ao abrir o app atualizado, a mudança de `versaoDados` faz o texto ser reimportado
automaticamente (apenas uma vez; alguns segundos com a Bíblia completa). Favoritos,
destaques e preferências são preservados. O aviso "base demonstrativa" desaparece
sozinho porque `demonstrativo` passa a ser `false`.

---

## 5. Gerar versões para Android e iOS (EAS Build)

```bash
npm install -g eas-cli
```

```bash
eas login
```

```bash
eas build:configure
```

Antes do primeiro build, troque `br.com.seudominio.bibliaacf` em `app.json`
(`ios.bundleIdentifier` e `android.package`) por um identificador seu.

**Android**

```bash
eas build -p android --profile preview
```

Gera um **APK** para instalar e testar direto no celular.

```bash
eas build -p android --profile production
```

Gera o **AAB** para a Google Play (conta de desenvolvedor Google Play necessária).

**iOS** (requer conta Apple Developer)

```bash
eas build -p ios --profile production
```

```bash
eas submit -p ios
```

O `eas submit` envia ao App Store Connect / TestFlight. Para Android, `eas submit -p android`.

### Checklist de publicação

- [ ] Autorização da SBTB arquivada e crédito exigido exibido (campo `licenca`).
- [ ] `npm run validar-biblia -- --completo` aprovado.
- [ ] Identificadores do app e nome final definidos em `app.json`.
- [ ] Testes do roteiro acima em pelo menos um Android e um iPhone reais.
- [ ] Política de privacidade: o app não coleta nem transmite dados (tudo fica no aparelho).
- [ ] Capturas de tela nos tamanhos exigidos pelas lojas.

---

## 6. Versão web na Vercel (via GitHub)

O mesmo código gera um site (`npx expo export -p web` → pasta `dist`). O
`vercel.json` já define instalação, build, pasta de saída e rotas.

No navegador o SQLite **não** é usado, porque o armazenamento dele só aceita uma
aba aberta por vez. Em vez disso, o texto bíblico é montado em memória
(`src/db/bibliaMemoria.ts`) e favoritos, destaques e preferências ficam no
`localStorage` de cada navegador (`src/db/usuario.ts`). No Android e no iPhone,
tudo continua no SQLite.

**1. Enviar o projeto ao GitHub**

- Crie um repositório em https://github.com/new (ex.: `biblia-sagrada-acf`), sem README.
- Opção sem programas: na página do repositório vazio, clique em
  *uploading an existing file* e arraste **o conteúdo** da pasta
  `biblia-sagrada-acf` (os arquivos `package.json`, `app.json`, `vercel.json`
  e as pastas `app`, `src`, `assets`, `scripts` precisam ficar na raiz do
  repositório). Não envie `node_modules` nem `dist`, se existirem.
  Arquivos que começam com ponto (`.npmrc`, `.gitignore`) podem ficar ocultos
  no Windows: crie-os no GitHub com *Add file → Create new file* se não subirem.
- Opção com programa: GitHub Desktop (https://desktop.github.com) → *Add local
  repository* → *Publish repository*.

**2. Importar na Vercel**

- Em https://vercel.com/new, entre com o GitHub e escolha o repositório.
- *Framework Preset*: **Other** (as configurações vêm do `vercel.json`).
- Se o projeto estiver numa subpasta do repositório, ajuste *Root Directory*.
- Clique em **Deploy**. Cada novo envio ao GitHub publica uma nova versão.

**Para testar a versão web no computador:** `npm run web`.

### Instalar no celular (PWA)

O site é um app instalável: `npm run build:web` roda `scripts/pwa.js`, que copia
`web/` (manifesto, ícones e `sw.js`) para `dist/` e injeta as tags no
`index.html`. O service worker guarda o app no aparelho, então ele abre sem
internet depois da primeira visita. Na tela inicial, o botão **Instalar no
celular** usa o pedido de instalação do Chrome/Edge (Android) ou mostra o passo
a passo do Safari (iPhone: Compartilhar → Adicionar à Tela de Início). Quando o
app já está instalado, o botão some.

> A licença do texto ACF precisa cobrir também a publicação em site.

---

## 7. Decisões de projeto

- **Sem recursos além do pedido:** sem áudio, planos, estudos, IA, devocionais, anúncios ou notificações.
- **Sem animações chamativas:** apenas esmaecimentos curtos (≈200 ms).
- **Acessibilidade:** alvos de toque ≥ 44 pt, rótulos em português para leitores de
  tela, respeito ao tamanho de fonte do sistema e contraste confortável sem preto puro.
- **Tablets:** a coluna de texto é limitada a 640 px, como a mancha de uma página impressa.
