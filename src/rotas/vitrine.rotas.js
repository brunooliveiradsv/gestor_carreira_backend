// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');
const enqueteControlador = require('../controladores/enquete.controlador');

// Importa os middlewares necessários
const encontrarArtistaPorUrl = require('../middlewares/encontrarArtistaPorUrl'); 
const authFaMiddleware = require('../middlewares/authFa'); 

module.exports = (conexao) => {
  const roteador = express.Router();

  // --- ROTA ESPECÍFICA MOVIDA PARA CIMA ---
  // Esta rota agora é verificada ANTES da rota genérica /:url_unica
  roteador.get('/meus-likes',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.obterLikesDoFa(req, res, conexao, next)
  );

  // --- ROTAS PÚBLICAS (com parâmetro :url_unica) ---
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
  
  roteador.post('/:url_unica/aplaudir',
    authFaMiddleware(conexao),
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.registrarAplauso(req, res, conexao, next)
  );

  roteador.post('/posts/:id/reacao',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.registrarReacaoPost(req, res, conexao, next)
  );

  roteador.post('/musicas/:id/like',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.likeMusica(req, res, conexao, next)
  );

  roteador.post('/enquetes/votar/:idOpcao', 
    authFaMiddleware(conexao),
    (req, res, next) => enqueteControlador.votarEmOpcao(req, res, conexao, next)
  );

  roteador.post('/:url_unica/feedback',
  authFaMiddleware(conexao), // Garante que o fã está logado
  (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next), // Identifica o artista
  (req, res, next) => vitrineControlador.enviarFeedback(req, res, conexao, next)
);
  
  return roteador;
};