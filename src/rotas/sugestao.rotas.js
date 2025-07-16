// src/rotas/sugestao.rotas.js
const express = require('express');
const sugestaoControlador = require('../controladores/sugestao.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de sugestão exigem que o utilizador esteja logado
  roteador.use(authMiddleware(conexao));

  // A rota para um utilizador criar uma sugestão para uma música específica
  roteador.post('/musicas/:musica_id/sugerir', (req, res) => sugestaoControlador.criarSugestao(req, res, conexao));

  return roteador;
};