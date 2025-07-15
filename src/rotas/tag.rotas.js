// src/rotas/tag.rotas.js
const express = require('express');
const tagControlador = require('../controladores/tag.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // Rota para listar todas as tags do usuário
  roteador.get('/', (req, res) => tagControlador.listar(req, res, conexao));
  
  return roteador;
};