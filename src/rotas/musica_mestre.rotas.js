// src/rotas/musica_mestre.rotas.js
const express = require('express');
const musicaMestreControlador = require('../controladores/musica_mestre.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const adminMiddleware = require('../middlewares/admin');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de música mestre exigem admin
  roteador.use(authMiddleware(conexao), adminMiddleware());

  roteador.get('/', (req, res) => musicaMestreControlador.listar(req, res, conexao));
  roteador.post('/', (req, res) => musicaMestreControlador.criar(req, res, conexao));
  roteador.put('/:id', (req, res) => musicaMestreControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaMestreControlador.apagar(req, res, conexao));
  
  return roteador;
};