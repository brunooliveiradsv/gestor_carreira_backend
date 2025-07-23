// src/rotas/usuario.rotas.js
const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const { storage } = require('../config/multerCloudinary');
const usuarioControlador = require('../controladores/usuario.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const validar = require('../middlewares/validador');

module.exports = (conexao) => {
  const roteador = express.Router();
  const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

  const registrarRegras = [
    body('nome').notEmpty().withMessage('O nome é um campo obrigatório.'),
    body('email').isEmail().withMessage('Forneça um e-mail válido.'),
    body('senha').isLength({ min: 8 }).withMessage('A senha deve ter no mínimo 8 caracteres.'),
  ];

  // Rotas Públicas
  roteador.post('/registrar', registrarRegras, validar, (req, res, next) => usuarioControlador.registrar(req, res, conexao, next));
  roteador.post('/login', (req, res, next) => usuarioControlador.login(req, res, conexao, next));
  roteador.post('/recuperar-senha', (req, res, next) => usuarioControlador.recuperarSenha(req, res, conexao, next));

  // Middleware de Autenticação
  roteador.use(authMiddleware(conexao));

  // Rotas Privadas
  roteador.get('/perfil', (req, res, next) => usuarioControlador.buscarPerfil(req, res, conexao, next));
  roteador.put('/perfil/nome', (req, res, next) => usuarioControlador.atualizarNome(req, res, conexao, next));
  roteador.put('/perfil/email', (req, res, next) => usuarioControlador.atualizarEmail(req, res, conexao, next));
  roteador.put('/perfil/senha', (req, res, next) => usuarioControlador.atualizarSenha(req, res, conexao, next));
  roteador.put('/perfil/publico', (req, res, next) => usuarioControlador.atualizarPerfilPublico(req, res, conexao, next));
  roteador.put('/perfil/foto', upload.single('foto'), (req, res, next) => usuarioControlador.atualizarFoto(req, res, conexao, next));
  
  // --- CORREÇÃO AQUI ---
  roteador.put('/perfil/capas', upload.array('capas', 3), (req, res, next) => usuarioControlador.atualizarFotosCapa(req, res, conexao, next));

  return roteador;
};