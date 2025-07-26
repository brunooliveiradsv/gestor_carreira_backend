// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');
const enqueteControlador = require('../controladores/enquete.controlador');

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.get('/:url_unica', (req, res, next) => vitrineControlador.obterVitrine(req, res, conexao, next));
  roteador.post('/:url_unica/aplaudir', (req, res, next) => vitrineControlador.registrarAplauso(req, res, conexao, next));
  roteador.post('/posts/:id/reacao', (req, res, next) => vitrineControlador.registrarReacaoPost(req, res, conexao, next));
  roteador.post('/enquetes/votar/:idOpcao', (req, res, next) => enqueteControlador.votarEmOpcao(req, res, conexao, next));
  return roteador;
};