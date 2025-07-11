// src/rotas/admin.rotas.js
const express = require('express');
const adminControlador = require('../controladores/admin.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const adminMiddleware = require('../middlewares/admin');

module.exports = (conexao) => {
  const roteador = express.Router();

  // Aplica a segurança em todas as rotas de admin
  roteador.use(authMiddleware(conexao), adminMiddleware());

  // --- Rotas de Gerenciamento de Usuários ---
  roteador.get('/usuarios', (req, res) => adminControlador.listarUsuarios(req, res, conexao));
  roteador.put('/usuarios/:id', (req, res) => adminControlador.atualizarUsuario(req, res, conexao));
  roteador.delete('/usuarios/:id', (req, res) => adminControlador.apagarUsuario(req, res, conexao));
  
  // --- ROTA POST QUE ESTAVA FALTANDO ---
  roteador.post('/usuarios', (req, res) => adminControlador.criarUsuario(req, res, conexao));

  roteador.delete('/usuarios/:id/dados', (req, res) => adminControlador.limparDadosUsuario(req, res, conexao));
  
  return roteador;
};