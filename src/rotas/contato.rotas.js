// src/rotas/contato.rotas.js
const express = require('express');
const contatoControlador = require('../controladores/contato.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  roteador.post('/', (req, res) => contatoControlador.criar(req, res, conexao));
  roteador.get('/', (req, res) => contatoControlador.listar(req, res, conexao));
  
  // --- ROTA NOVA ---
  // Rota para buscar um contato específico pelo seu ID
  roteador.get('/:id', (req, res) => contatoControlador.buscarPorId(req, res, conexao));

  roteador.put('/:id', (req, res) => contatoControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => contatoControlador.apagar(req, res, conexao));
  
  return roteador;
};