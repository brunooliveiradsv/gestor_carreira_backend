// src/rotas/compromisso.rotas.js
const express = require('express');
const compromissoControlador = require('../controladores/compromisso.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.use(authMiddleware(conexao));

  // --- NOVA ROTA PARA O DASHBOARD ---
  roteador.get('/proximos', (req, res) => compromissoControlador.proximos(req, res, conexao));

  roteador.post('/', (req, res) => compromissoControlador.criar(req, res, conexao));
  
  roteador.get('/', (req, res) => compromissoControlador.listar(req, res, conexao));

  roteador.get('/:id', (req, res) => compromissoControlador.buscarPorId(req, res, conexao));

  roteador.put('/:id', (req, res) => compromissoControlador.atualizar(req, res, conexao));

  roteador.delete('/:id', (req, res) => compromissoControlador.apagar(req, res, conexao));
  
  return roteador;
};