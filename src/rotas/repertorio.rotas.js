// src/rotas/repertorio.rotas.js
const express = require('express');
const repertorioControlador = require('../controladores/repertorio.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  roteador.post('/', (req, res) => repertorioControlador.criar(req, res, conexao));
  roteador.get('/', (req, res) => repertorioControlador.listar(req, res, conexao));
  roteador.get('/:id', (req, res) => repertorioControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', (req, res) => repertorioControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => repertorioControlador.apagar(req, res, conexao));

  return roteador;
};