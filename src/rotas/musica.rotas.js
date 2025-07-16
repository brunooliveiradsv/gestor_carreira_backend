// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // Rotas que permanecem no backend
  roteador.get('/busca-interna', (req, res) => musicaControlador.buscaInterna(req, res, conexao));
  roteador.get('/', (req, res) => musicaControlador.listar(req, res, conexao));
  roteador.post('/', (req, res) => musicaControlador.criar(req, res, conexao));
  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));
  roteador.post('/:id/tocar', (req, res) => musicaControlador.tocarMusica(req, res, conexao));
  

  return roteador;
};