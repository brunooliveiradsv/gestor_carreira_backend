// src/rotas/usuario.rotas.js
const express = require('express');
const usuarioControlador = require('../controladores/usuario.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();

  // Rotas públicas (não exigem autenticação)
  roteador.post('/registrar', (req, res) => usuarioControlador.registrar(req, res, conexao));
  roteador.post('/login', (req, res) => usuarioControlador.login(req, res, conexao));
  // --- NOVA ROTA DE RECUPERAÇÃO DE SENHA ---
  roteador.post('/recuperar-senha', (req, res) => usuarioControlador.recuperarSenha(req, res, conexao));

  // Rotas privadas (exigem autenticação via authMiddleware)
  roteador.get('/perfil', authMiddleware(conexao), (req, res) => usuarioControlador.buscarPerfil(req, res, conexao));
  // Rota para atualizar o e-mail do usuário logado
   roteador.put('/perfil/email', authMiddleware(conexao), (req, res) => usuarioControlador.atualizarEmail(req, res, conexao));
  // Rota para atualizar a senha do usuário logado
  roteador.put('/perfil/senha', authMiddleware(conexao), (req, res) => usuarioControlador.atualizarSenha(req, res, conexao));

  return roteador;
};