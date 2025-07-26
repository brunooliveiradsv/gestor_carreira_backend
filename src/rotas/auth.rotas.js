// src/rotas/auth.rotas.js
const express = require('express');
const authControlador = require('../controladores/auth.controlador');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Rota pública para o callback do login do Google
  roteador.post('/google/callback', (req, res, next) => authControlador.googleCallback(req, res, conexao, next));

  return roteador;
};