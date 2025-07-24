// src/rotas/setlist.rotas.js
const express = require('express');
const setlistControlador = require('../controladores/setlist.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const verificarPlano = require('../middlewares/verificarPlano');
const limiteRecurso = require('../middlewares/limiteRecurso');

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.get('/publico/:uuid', (req, res, next) => setlistControlador.buscarPublicoPorUuid(req, res, conexao, next));

  roteador.use(authMiddleware(conexao));

  roteador.get('/estatisticas', (req, res, next) => setlistControlador.estatisticas(req, res, conexao, next));
  roteador.get('/', (req, res, next) => setlistControlador.listar(req, res, conexao, next));
  roteador.post('/', limiteRecurso('setlists', conexao.models.Setlist), (req, res, next) => setlistControlador.criar(req, res, conexao, next));

  roteador.get('/:id', (req, res, next) => setlistControlador.buscarPorId(req, res, conexao, next));
  roteador.put('/:id', (req, res, next) => setlistControlador.atualizar(req, res, conexao, next));
  roteador.delete('/:id', (req, res, next) => setlistControlador.apagar(req, res, conexao, next));

  roteador.put('/:id/musicas', (req, res, next) => setlistControlador.atualizarMusicas(req, res, conexao, next));
  roteador.post('/:id/sugerir', (req, res, next) => setlistControlador.sugerirMusicas(req, res, conexao, next));
  roteador.patch('/:id/partilhar', verificarPlano('padrao'), (req, res, next) => setlistControlador.gerirPartilha(req, res, conexao, next));

  return roteador;
};