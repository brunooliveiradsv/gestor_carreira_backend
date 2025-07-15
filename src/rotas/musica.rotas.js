// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // Rota para listar músicas com filtros avançados via query string
  // Ex: /api/musicas?tom=G&tags=1,5&termoBusca=amor
  roteador.get('/', (req, res) => musicaControlador.listar(req, res, conexao));
  
  // Rota para criar uma nova música
  roteador.post('/', (req, res) => musicaControlador.criar(req, res, conexao));
  
  // Rota para atualizar uma música específica
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  
  // Rota para apagar uma música
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));

  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
    // Rota para listar músicas de um artista específico

  // Rota especial para registrar que uma música foi tocada
  roteador.post('/:id/tocar', (req, res) => musicaControlador.tocarMusica(req, res, conexao));

  return roteador;
};