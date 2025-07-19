// src/rotas/post.rotas.js
const express = require('express');
const postControlador = require('../controladores/post.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de posts exigem que o utilizador esteja logado
  roteador.use(authMiddleware(conexao));

  roteador.post('/', (req, res) => postControlador.criar(req, res, conexao));
  roteador.get('/', (req, res) => postControlador.listarPorUsuario(req, res, conexao));
  roteador.delete('/:id', (req, res) => postControlador.apagar(req, res, conexao));

  return roteador;
};