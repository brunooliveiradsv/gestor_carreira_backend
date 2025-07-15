// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- Rotas Gerais (sem ID) ---
  // Estas rotas não têm parâmetros e devem vir primeiro.
  
  // Lista todas as músicas com filtros
  roteador.get('/', (req, res) => musicaControlador.listar(req, res, conexao));
  
  // Cria uma nova música
  roteador.post('/', (req, res) => musicaControlador.criar(req, res, conexao));
  
  // Rota específica para raspagem (scraping)
  roteador.post('/raspar-cifra', (req, res) => musicaControlador.rasparCifra(req, res, conexao));
  
  // --- Rotas Específicas (com /:id) ---
  // O Express só chegará a estas rotas se o caminho não corresponder às de cima.

  // Busca uma música específica por ID
  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
  
  // Atualiza uma música específica
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  
  // Apaga uma música específica
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));

  // Registra que uma música foi tocada
  roteador.post('/:id/tocar', (req, res) => musicaControlador.tocarMusica(req, res, conexao));

  return roteador;
};