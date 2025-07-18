// src/rotas/musica.rotas.js
const express = require('express');
const musicaControlador = require('../controladores/musica.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // Rotas para o usuário gerir o seu repertório pessoal
  roteador.get('/', (req, res) => musicaControlador.listarRepertorioUsuario(req, res, conexao));
  roteador.post('/manual', (req, res) => musicaControlador.criarManual(req, res, conexao));
  roteador.put('/:id', (req, res) => musicaControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => musicaControlador.apagar(req, res, conexao));

  // Rota para o usuário pesquisar no banco de dados público
  roteador.get('/buscar-publicas', (req, res) => musicaControlador.buscarMusicasPublicas(req, res, conexao));
  
  // Rota para o usuário importar uma música pública para o seu repertório
  roteador.post('/importar', (req, res) => musicaControlador.importar(req, res, conexao));
  
  return roteador;
};