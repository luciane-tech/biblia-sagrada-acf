#!/usr/bin/env node
/**
 * Converte uma base de texto licenciada (TSV ou CSV) para o formato do app.
 *
 * Uso:
 *   node scripts/converter-biblia.js <arquivo.tsv|csv> --versao acf-2026-01 \
 *        --fonte "Sociedade Bíblica Trinitariana do Brasil" \
 *        --licenca "Texto ACF © SBTB. Uso autorizado conforme contrato nº ..."
 *
 * Colunas esperadas (com ou sem linha de cabeçalho):
 *   livro (1–66) | capitulo | versiculo | texto | paragrafo (opcional: 1 = inicia parágrafo)
 *
 * O texto é gravado EXATAMENTE como está no arquivo de origem: apenas espaços
 * nas pontas são removidos e a codificação Unicode é padronizada (NFC), sem
 * qualquer alteração de palavras ou pontuação.
 *
 * Gera assets/biblia/biblia.json e assets/biblia/versao.json.
 * Depois, rode: node scripts/validar-biblia.js --completo
 */
const fs = require('fs');
const path = require('path');

function argumento(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : padrao;
}

const entrada = process.argv[2];
if (!entrada || entrada.startsWith('--')) {
  console.error('Informe o arquivo de origem. Ex.: node scripts/converter-biblia.js acf.tsv --versao acf-1');
  process.exit(1);
}
const versaoDados = argumento('versao');
if (!versaoDados) {
  console.error('Informe --versao (ex.: acf-2026-01). Ela força a reimportação nos aparelhos.');
  process.exit(1);
}

const conteudo = fs.readFileSync(entrada, 'utf8').replace(/^﻿/, '');
const separador = entrada.toLowerCase().endsWith('.csv') ? ',' : '\t';

/** Divide uma linha CSV respeitando aspas. */
function dividirCsv(linha) {
  const campos = [];
  let atual = '';
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
      else if (c === '"') aspas = false;
      else atual += c;
    } else if (c === '"') aspas = true;
    else if (c === ',') { campos.push(atual); atual = ''; }
    else atual += c;
  }
  campos.push(atual);
  return campos;
}

const versiculos = [];
const erros = [];
conteudo.split(/\r?\n/).forEach((linha, n) => {
  if (!linha.trim()) return;
  const campos = separador === ',' ? dividirCsv(linha) : linha.split('\t');
  const [l, c, v, texto, p] = campos;
  const livro = Number(l), capitulo = Number(c), versiculo = Number(v);
  if (n === 0 && Number.isNaN(livro)) return; // cabeçalho
  if (!Number.isInteger(livro) || livro < 1 || livro > 66 || !Number.isInteger(capitulo) || !Number.isInteger(versiculo)) {
    erros.push(`linha ${n + 1}: referência inválida (${l}, ${c}, ${v})`);
    return;
  }
  const limpo = (texto ?? '').trim().normalize('NFC');
  if (!limpo) {
    erros.push(`linha ${n + 1}: texto vazio`);
    return;
  }
  const linhaSaida = [livro, capitulo, versiculo, limpo];
  if (p !== undefined && String(p).trim() === '1') linhaSaida.push(1);
  versiculos.push(linhaSaida);
});

if (erros.length) {
  console.error(`Foram encontrados ${erros.length} problemas:\n` + erros.slice(0, 30).join('\n'));
  process.exit(1);
}

versiculos.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);

const saida = {
  meta: {
    traducao: argumento('traducao', 'Almeida Corrigida Fiel'),
    sigla: argumento('sigla', 'ACF'),
    versaoDados,
    demonstrativo: false,
    fonte: argumento('fonte', ''),
    licenca: argumento('licenca', ''),
  },
  versiculos,
};

const pasta = path.join(__dirname, '..', 'assets', 'biblia');
fs.writeFileSync(path.join(pasta, 'biblia.json'), JSON.stringify(saida));
fs.writeFileSync(path.join(pasta, 'versao.json'), JSON.stringify({ versaoDados }, null, 2) + '\n');
console.log(`OK: ${versiculos.length} versículos gravados em assets/biblia/biblia.json (versão ${versaoDados}).`);
