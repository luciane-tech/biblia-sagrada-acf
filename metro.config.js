// Configuração do Metro (empacotador do Expo).
// O expo-sqlite na web usa WebAssembly e exige isolamento entre origens
// (cabeçalhos COOP/COEP). Em produção, os mesmos cabeçalhos estão em vercel.json.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
