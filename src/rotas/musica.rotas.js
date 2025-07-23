// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const sugestaoControlador = require('../controladores/sugestao.controlador'); // Importe o controlador de sugestões
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- ORDEM CORRIGIDA E ROTA DE SUGESTÃO ADICIONADA ---

  // Rotas mais específicas vêm primeiro
  roteador.get('/buscar-publicas', (req, res) => musicaControlador.buscarMusicasPublicas(req, res, conexao));
  roteador.post('/importar', (req, res) => musicaControlador.importar(req, res, conexao));
  roteador.post('/manual', (req, res) => musicaControlador.criarManual(req, res, conexao));
  
  // Rotas de repertório
  roteador.get('/', (req, res) => musicaControlador.listarRepertorioUsuario(req, res, conexao));
  
  // Rotas genéricas com ID vêm por último
  roteador.get('/:id', (req, res) => musicaControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));

  // Rota para criar uma sugestão para uma música específica
  roteador.post('/:musica_id/sugerir', (req, res) => sugestaoControlador.criarSugestao(req, res, conexao));

  roteador.post('/:id/sincronizar', (req, res, next) => musicaControlador.sincronizarComMestre(req, res, conexao, next));
  
  
  return roteador;
};