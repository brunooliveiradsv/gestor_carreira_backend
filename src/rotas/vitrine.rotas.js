// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');
const enqueteControlador = require('../controladores/enquete.controlador');

// Importa os middlewares necessários
const encontrarArtistaPorUrl = require('../middlewares/encontrarArtistaPorUrl'); 
const authFaMiddleware = require('../middlewares/authFa'); 

module.exports = (conexao) => {
  const roteador = express.Router();

  // --- ROTAS PÚBLICAS (não exigem login de fã) ---
  // Middleware para encontrar o artista é aplicado primeiro
  roteador.get('/:url_unica', 
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterVitrine(req, res, conexao, next)
  );
  
  roteador.get('/:url_unica/ranking',
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterRankingFas(req, res, conexao, next)
  );

  roteador.get('/:url_unica/musicas-curtidas',
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterMusicasMaisCurtidas(req, res, conexao, next)
  );

  // --- ROTAS PROTEGIDAS (exigem login de fã) ---
  
  // Rota de aplauso
  roteador.post('/:url_unica/aplaudir',
    authFaMiddleware(conexao), // 1. Verifica o token do fã
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next), // 2. Encontra o artista
    (req, res, next) => vitrineControlador.registrarAplauso(req, res, conexao, next) // 3. Executa a ação
  );

  // Rota de "gosto/não gosto"
  roteador.post('/posts/:id/reacao',
    authFaMiddleware(conexao), // 1. Garante que um fã está logado
    (req, res, next) => vitrineControlador.registrarReacaoPost(req, res, conexao, next) // 2. Executa a ação
  );

  // Rota para curtir uma música
  roteador.post('/musicas/:id/like',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.likeMusica(req, res, conexao, next)
  );

  // ROTA DE VOTAÇÃO MOVIDA PARA AQUI
  roteador.post('/enquetes/votar/:idOpcao', 
    authFaMiddleware(conexao), // Middleware de autenticação de fã adicionado
    (req, res, next) => enqueteControlador.votarEmOpcao(req, res, conexao, next)
  );

  roteador.get('/meus-likes',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.obterLikesDoFa(req, res, conexao, next)
  );
  
  return roteador;
};