// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- Rotas Gerais (sem parâmetros) ---
  // Estas são as rotas mais específicas e devem vir primeiro.
  roteador.get('/', (req, res) => musicaControlador.listar(req, res, conexao));
  roteador.post('/', (req, res) => musicaControlador.criar(req, res, conexao));
  roteador.post('/raspar-cifra', (req, res) => musicaControlador.rasparCifra(req, res, conexao));
  roteador.post('/busca-inteligente', (req, res) => musicaControlador.buscaInteligente(req, res, conexao));

  // --- Rotas com Parâmetro /:id ---
  // O Express só chegará a estas se o caminho não corresponder às de cima.
  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));
  roteador.post('/:id/tocar', (req, res) => musicaControlador.tocarMusica(req, res, conexao));

  return roteador;
};