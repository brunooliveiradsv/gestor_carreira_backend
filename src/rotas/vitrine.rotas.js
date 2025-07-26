// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');
const enqueteControlador = require('../controladores/enquete.controlador');

// --- MIDDLEWARES NOVOS (A SEREM CRIADOS) ---
// Estes middlewares serão necessários para obter os dados do artista e do fã
const encontrarArtistaPorUrl = require('../middlewares/encontrarArtistaPorUrl'); 
const authFaMiddleware = require('../middlewares/authFa'); 

module.exports = (conexao) => {
  const roteador = express.Router();

  // Rotas públicas que não precisam de login de fã
  roteador.get('/:url_unica', 
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterVitrine(req, res, conexao, next)
  );
  roteador.post('/enquetes/votar/:idOpcao', (req, res, next) => enqueteControlador.votarEmOpcao(req, res, conexao, next));

  // --- NOVAS ROTAS ADICIONADAS ---
  roteador.get('/:url_unica/ranking',
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterRankingFas(req, res, conexao, next)
  );
  roteador.get('/:url_unica/musicas-curtidas',
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.obterMusicasMaisCurtidas(req, res, conexao, next)
  );

  // --- ROTAS QUE AGORA PRECISAM DE AUTENTICAÇÃO DE FÃ ---
  // Note que o `authFaMiddleware` deve ser criado
  roteador.post('/:url_unica/aplaudir',
    authFaMiddleware(conexao),
    (req, res, next) => encontrarArtistaPorUrl(req, res, conexao, next),
    (req, res, next) => vitrineControlador.registrarAplauso(req, res, conexao, next)
  );
  roteador.post('/musicas/:id/like',
    authFaMiddleware(conexao),
    (req, res, next) => vitrineControlador.likeMusica(req, res, conexao, next)
  );
  
  return roteador;
};