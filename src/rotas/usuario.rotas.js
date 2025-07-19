// src/rotas/usuario.rotas.js
const express = require('express');
const multer = require('multer');
const multerConfig = require('../config/multer');
const usuarioControlador = require('../controladores/usuario.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  const upload = multer(multerConfig);

  // Rotas públicas (não exigem autenticação)
  roteador.post('/registrar', (req, res) => usuarioControlador.registrar(req, res, conexao));
  roteador.post('/login', (req, res) => usuarioControlador.login(req, res, conexao));
  roteador.post('/recuperar-senha', (req, res) => usuarioControlador.recuperarSenha(req, res, conexao));

  // A partir daqui, todas as rotas exigem autenticação
  roteador.use(authMiddleware(conexao));
  
  // Rotas privadas
  roteador.get('/perfil', (req, res) => usuarioControlador.buscarPerfil(req, res, conexao));
  roteador.put('/perfil/email', (req, res) => usuarioControlador.atualizarEmail(req, res, conexao));
  roteador.put('/perfil/senha', (req, res) => usuarioControlador.atualizarSenha(req, res, conexao));
  
  // --- ROTA DE FOTO ATUALIZADA COM TRATAMENTO DE ERRO ---
   roteador.put('/perfil/foto', upload.single('foto'), (req, res) => {
      if (!req.file) {
          return res.status(400).json({ mensagem: 'Nenhum ficheiro enviado ou tipo de ficheiro inválido.' });
      }
      usuarioControlador.atualizarFoto(req, res, conexao);
  });

  roteador.put('/perfil/publico', (req, res) => usuarioControlador.atualizarPerfilPublico(req, res, conexao));

  return roteador;
};