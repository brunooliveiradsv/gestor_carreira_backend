// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.get('/:url_unica', (req, res) => vitrineControlador.obterVitrine(req, res, conexao));
  roteador.post('/:url_unica/aplaudir', (req, res) => vitrineControlador.registrarAplauso(req, res, conexao));

  // --- ROTA NOVA ---
  roteador.post('/posts/:id/reacao', (req, res) => vitrineControlador.registrarReacaoPost(req, res, conexao));

  return roteador;
};