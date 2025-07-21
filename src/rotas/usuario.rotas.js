// src/rotas/usuario.rotas.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/multerCloudinary'); // Importa a configuração do Cloudinary
const usuarioControlador = require('../controladores/usuario.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  const upload = multer({ storage: storage }); // Configura o Multer para usar o Cloudinary

  // --- Rotas Públicas (não exigem autenticação) ---
  roteador.post('/registrar', (req, res) => usuarioControlador.registrar(req, res, conexao));
  roteador.post('/login', (req, res) => usuarioControlador.login(req, res, conexao));
  roteador.post('/recuperar-senha', (req, res) => usuarioControlador.recuperarSenha(req, res, conexao));

  // --- Middleware de Autenticação ---
  // Todas as rotas abaixo desta linha exigem um token válido
  roteador.use(authMiddleware(conexao));

  // --- Rotas Privadas (exigem autenticação) ---
  roteador.get('/perfil', (req, res) => usuarioControlador.buscarPerfil(req, res, conexao));
    roteador.put('/perfil/nome', (req, res) => usuarioControlador.atualizarNome(req, res, conexao));
  roteador.put('/perfil/email', (req, res) => usuarioControlador.atualizarEmail(req, res, conexao));
  roteador.put('/perfil/senha', (req, res) => usuarioControlador.atualizarSenha(req, res, conexao));
  roteador.put('/perfil/publico', (req, res) => usuarioControlador.atualizarPerfilPublico(req, res, conexao));

  // Rota para upload da foto de perfil, usando o Multer com a configuração do Cloudinary
  roteador.put('/perfil/foto', upload.single('foto'), (req, res) => usuarioControlador.atualizarFoto(req, res, conexao));
  roteador.put('/perfil/capa', upload.single('capa'), (req, res) => usuarioControlador.atualizarFotoCapa(req, res, conexao));

  return roteador;
};