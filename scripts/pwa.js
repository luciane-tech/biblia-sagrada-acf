#!/usr/bin/env node
/**
 * Pós-build da versão web: transforma o site em app instalável (PWA).
 * - copia web/ (manifesto, ícones, service worker) para dist/;
 * - injeta no dist/index.html as tags de manifesto e de ícone do iPhone;
 * - registra o service worker (que permite usar sem internet).
 *
 * Executado automaticamente por `npm run build:web` (e pela Vercel).
 */
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const origem = path.join(raiz, 'web');
const destino = path.join(raiz, 'dist');
const indice = path.join(destino, 'index.html');

if (!fs.existsSync(indice)) {
  console.error('dist/index.html não encontrado. Rode antes: npx expo export -p web');
  process.exit(1);
}

for (const nome of fs.readdirSync(origem)) {
  fs.copyFileSync(path.join(origem, nome), path.join(destino, nome));
}

// Nova versão de cache a cada build.
const versao = Date.now().toString(36);
const sw = path.join(destino, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/__VERSAO__/g, versao));

const tags = `
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#FAF7F0" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Bíblia" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
        });
      }
    </script>
  </head>`;

let html = fs.readFileSync(indice, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', tags);
}
html = html.replace(/<html([^>]*)lang="[^"]*"/, '<html$1lang="pt-BR"');
fs.writeFileSync(indice, html);

console.log(`PWA pronto: manifesto, ícones e service worker (cache ${versao}) em dist/.`);
