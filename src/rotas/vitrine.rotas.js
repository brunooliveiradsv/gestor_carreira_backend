// src/rotas/vitrine.rotas.js
const express = require('express');
const vitrineControlador = require('../controladores/vitrine.controlador');

module.exports = (conexao) => {
  const roteador = express.Router();

  // Esta rota é pública, não usa o middleware de autenticação
  roteador.get('/:url_unica', (req, res) => vitrineControlador.obterVitrine(req, res, conexao));

   // Rota para registrar um novo aplauso (nova)
  roteador.post('/:url_unica/aplaudir', (req, res) => vitrineControlador.registrarAplauso(req, res, conexao));

  return roteador;
};