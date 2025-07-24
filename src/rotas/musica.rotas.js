// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const sugestaoControlador = require('../controladores/sugestao.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const verificarPlano = require('../middlewares/verificarPlano');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  roteador.get('/buscar-publicas', (req, res) => musicaControlador.buscarMusicasPublicas(req, res, conexao));
  roteador.post('/importar', (req, res) => musicaControlador.importar(req, res, conexao));
  roteador.post('/manual', verificarPlano('padrao'), (req, res) => musicaControlador.criarManual(req, res, conexao));
  
  roteador.get('/', (req, res) => musicaControlador.listarRepertorioUsuario(req, res, conexao));
  
  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', verificarPlano('padrao'), (req, res) => musicaControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));

  roteador.post('/:musica_id/sugerir', verificarPlano('padrao'), (req, res) => sugestaoControlador.criarSugestao(req, res, conexao));

  roteador.post('/:id/sincronizar', (req, res, next) => musicaControlador.sincronizarComMestre(req, res, conexao, next));
  
  return roteador;
};