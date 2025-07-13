// src/rotas/conquista.rotas.js
const express = require('express');
const conquistaControlador = require('../controladores/conquista.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  roteador.use(authMiddleware(conexao));

  // --- NOVA ROTA PARA O DASHBOARD ---
  roteador.get('/recentes', (req, res) => conquistaControlador.recentes(req, res, conexao));

  roteador.get('/', (req, res) => conquistaControlador.listarConquistasComProgresso(req, res, conexao));
  
  return roteador;
};