// src/rotas/admin.rotas.js
const express = require('express');
const adminControlador = require('../controladores/admin.controlador');
// --- LINHA ADICIONADA ---
const sugestaoControlador = require('../controladores/sugestao.controlador'); 
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
  roteador.post('/usuarios', (req, res) => adminControlador.criarUsuario(req, res, conexao));
  roteador.delete('/usuarios/:id/dados', (req, res) => adminControlador.limparDadosUsuario(req, res, conexao));

  // --- ROTAS DE MODERAÇÃO DE SUGESTÕES ---
  roteador.get('/sugestoes', (req, res) => sugestaoControlador.listarSugestoesPendentes(req, res, conexao));
  roteador.put('/sugestoes/:id/aprovar', (req, res) => sugestaoControlador.aprovarSugestao(req, res, conexao));
  roteador.put('/sugestoes/:id/rejeitar', (req, res) => sugestaoControlador.rejeitarSugestao(req, res, conexao));
  
  return roteador;
};