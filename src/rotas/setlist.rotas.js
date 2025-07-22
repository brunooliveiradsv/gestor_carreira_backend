// src/rotas/setlist.rotas.js
const express = require('express');
const setlistControlador = require('../controladores/setlist.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const assinaturaMiddleware = require('../middlewares/assinatura');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- ROTAS DO DASHBOARD E GERAIS ---
  roteador.get('/estatisticas', (req, res, next) => setlistControlador.estatisticas(req, res, conexao, next));
  roteador.get('/', (req, res, next) => setlistControlador.listar(req, res, conexao, next));
  roteador.post('/', assinaturaMiddleware(), (req, res, next) => setlistControlador.criar(req, res, conexao, next));

  // --- ROTAS ESPECÍFICAS DE UM SETLIST ---
  roteador.get('/:id', (req, res, next) => setlistControlador.buscarPorId(req, res, conexao, next));
  roteador.put('/:id', (req, res, next) => setlistControlador.atualizar(req, res, conexao, next));
  roteador.delete('/:id', (req, res, next) => setlistControlador.apagar(req, res, conexao, next));

  // --- ROTAS DE MANIPULAÇÃO DE MÚSICAS NO SETLIST ---
  roteador.put('/:id/musicas', (req, res, next) => setlistControlador.atualizarMusicas(req, res, conexao, next));
  roteador.post('/:id/sugerir', (req, res, next) => setlistControlador.sugerirMusicas(req, res, conexao, next));

  return roteador;
};