// src/rotas/log.rotas.js
const express = require('express');
const logControlador = require('../controladores/log.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const adminMiddleware = require('../middlewares/admin');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Apenas admins podem ver os logs
  roteador.use(authMiddleware(conexao), adminMiddleware());

  roteador.get('/', (req, res) => logControlador.listarLogs(req, res, conexao));

  return roteador;
};