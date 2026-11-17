#!/usr/bin/env node
/**
 * Valida assets/biblia/biblia.json.
 *
 *   node scripts/validar-biblia.js             → relatório
 *   node scripts/validar-biblia.js --completo  → falha (código 1) se faltar qualquer
 *                                                capítulo ou se a base for demonstrativa.
 *                                                Use antes de gerar a versão de publicação.
 */
const fs = require('fs');
const path = require('path');

// Mesma tabela de src/dados/livros.ts (nome, nº de capítulos).
const LIVROS = [
  ['Gênesis', 50], ['Êxodo', 40], ['Levítico', 27], ['Números', 36], ['Deuteronômio', 34],
  ['Josué', 24], ['Juízes', 21], ['Rute', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Reis', 22], ['2 Reis', 25], ['1 Crônicas', 29], ['2 Crônicas', 36], ['Esdras', 10],
  ['Neemias', 13], ['Ester', 10], ['Jó', 42], ['Salmos', 150], ['Provérbios', 31],
  ['Eclesiastes', 12], ['Cantares', 8], ['Isaías', 66], ['Jeremias', 52], ['Lamentações', 5],
  ['Ezequiel', 48], ['Daniel', 12], ['Oséias', 14], ['Joel', 3], ['Amós', 9],
  ['Obadias', 1], ['Jonas', 4], ['Miquéias', 7], ['Naum', 3], ['Habacuque', 3],
  ['Sofonias', 3], ['Ageu', 2], ['Zacarias', 14], ['Malaquias', 4],
  ['Mateus', 28], ['Marcos', 16], ['Lucas', 24], ['João', 21], ['Atos', 28],
  ['Romanos', 16], ['1 Coríntios', 16], ['2 Coríntios', 13], ['Gálatas', 6], ['Efésios', 6],
  ['Filipenses', 4], ['Colossenses', 4], ['1 Tessalonicenses', 5], ['2 Tessalonicenses', 3],
  ['1 Timóteo', 6], ['2 Timóteo', 4], ['Tito', 3], ['Filemom', 1], ['Hebreus', 13],
  ['Tiago', 5], ['1 Pedro', 5], ['2 Pedro', 3], ['1 João', 5], ['2 João', 1],
  ['3 João', 1], ['Judas', 1], ['Apocalipse', 22],
];

const completo = process.argv.includes('--completo');
const pasta = path.join(__dirname, '..', 'assets', 'biblia');
const dados = JSON.parse(fs.readFileSync(path.join(pasta, 'biblia.json'), 'utf8'));
const versao = JSON.parse(fs.readFileSync(path.join(pasta, 'versao.json'), 'utf8'));

const erros = [];
const avisos = [];

if (versao.versaoDados !== dados.meta.versaoDados) {
  erros.push(`versao.json (${versao.versaoDados}) difere de biblia.json (${dados.meta.versaoDados}).`);
}

const capitulos = new Map(); // "livro:capitulo" -> [versiculos]
const vistos = new Set();
for (const [livro, capitulo, versiculo, texto] of dados.versiculos) {
  const chave = `${livro}:${capitulo}:${versiculo}`;
  if (vistos.has(chave)) erros.push(`Versículo duplicado: ${chave}`);
  vistos.add(chave);
  if (!LIVROS[livro - 1]) { erros.push(`Livro inexistente: ${livro}`); continue; }
  if (capitulo < 1 || capitulo > LIVROS[livro - 1][1]) erros.push(`Capítulo inexistente: ${LIVROS[livro - 1][0]} ${capitulo}`);
  if (typeof texto !== 'string' || !texto.trim()) erros.push(`Texto vazio: ${chave}`);
  else if (texto !== texto.trim()) avisos.push(`Espaços nas pontas: ${chave}`);
  const k = `${livro}:${capitulo}`;
  if (!capitulos.has(k)) capitulos.set(k, []);
  capitulos.get(k).push(versiculo);
}

let faltando = 0;
LIVROS.forEach(([nome, total], i) => {
  for (let c = 1; c <= total; c++) {
    const lista = capitulos.get(`${i + 1}:${c}`);
    if (!lista) { faltando++; continue; }
    lista.sort((a, b) => a - b);
    lista.forEach((v, j) => {
      if (j > 0 && v !== lista[j - 1] + 1) avisos.push(`${nome} ${c}: salto entre os versículos ${lista[j - 1]} e ${v}`);
    });
    if (lista[0] !== 1) avisos.push(`${nome} ${c}: começa no versículo ${lista[0]}`);
  }
});

if (completo) {
  if (dados.meta.demonstrativo) erros.push('A base ainda é demonstrativa.');
  if (faltando > 0) erros.push(`${faltando} capítulos ausentes.`);
}

console.log(`Tradução: ${dados.meta.traducao} (${dados.meta.sigla}) — versão ${dados.meta.versaoDados}`);
console.log(`Versículos: ${dados.versiculos.length}`);
console.log(`Capítulos presentes: ${capitulos.size} de 1189 (faltando ${faltando})`);
console.log(`Demonstrativa: ${dados.meta.demonstrativo ? 'SIM' : 'não'}`);
if (avisos.length) console.log(`\nAvisos (${avisos.length}):\n  ` + avisos.slice(0, 40).join('\n  '));
if (erros.length) console.log(`\nErros (${erros.length}):\n  ` + erros.slice(0, 40).join('\n  '));

if (erros.length) {
  console.log('\nResultado: REPROVADA');
  process.exit(1);
}
console.log('\nResultado: OK');
