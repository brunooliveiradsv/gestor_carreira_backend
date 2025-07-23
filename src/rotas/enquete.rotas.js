// src/rotas/enquete.rotas.js
const express = require('express');
const enqueteControlador = require('../controladores/enquete.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de GESTÃO de enquetes exigem que o utilizador esteja logado
  roteador.use(authMiddleware(conexao));

  roteador.post('/', (req, res, next) => enqueteControlador.criarEnquete(req, res, conexao, next));
  roteador.get('/', (req, res, next) => enqueteControlador.listarEnquetes(req, res, conexao, next));
  roteador.patch('/:id/ativar', (req, res, next) => enqueteControlador.ativarEnquete(req, res, conexao, next));
  roteador.delete('/:id', (req, res, next) => enqueteControlador.apagarEnquete(req, res, conexao, next));

  return roteador;
};