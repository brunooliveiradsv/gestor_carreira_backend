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
  roteador.put('/perfil/foto', (req, res) => {
    // Inicia o middleware de upload manualmente para capturar seus erros
    const singleUpload = upload.single('foto');

    singleUpload(req, res, (err) => {
      // Se o erro for do Multer (a biblioteca de upload)
      if (err instanceof multer.MulterError) {
        // Se o erro específico for o de limite de tamanho do arquivo
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ mensagem: 'O arquivo é muito grande. O limite máximo é de 5MB.' });
        }
        // Para outros erros do Multer
        return res.status(400).json({ mensagem: `Erro de upload: ${err.message}` });
      } else if (err) {
        // Para outros erros inesperados durante o upload
        return res.status(500).json({ mensagem: 'Ocorreu um erro inesperado no upload.' });
      }

      // Se não houve erro, chama a próxima função (o nosso controlador)
      usuarioControlador.atualizarFoto(req, res, conexao);
    });
  });

  roteador.put('/perfil/publico', (req, res) => usuarioControlador.atualizarPerfilPublico(req, res, conexao));

  return roteador;
};