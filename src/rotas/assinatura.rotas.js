// src/rotas/assinatura.rotas.js
const express = require('express');
const assinaturaControlador = require('../controladores/assinatura.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de assinatura exigem que o usuário esteja logado
  roteador.use(authMiddleware(conexao));

  // Rota para o usuário iniciar o período de teste gratuito
  roteador.post('/iniciar-teste', (req, res) => assinaturaControlador.iniciarTesteGratuito(req, res, conexao));

  roteador.post('/criar-sessao-checkout', (req, res) => assinaturaControlador.criarSessaoCheckout(req, res, conexao));

  roteador.put('/trocar-plano', (req, res) => assinaturaControlador.trocarPlano(req, res, conexao));

   roteador.post('/criar-sessao-portal', (req, res) => assinaturaControlador.criarSessaoPortal(req, res, conexao));

  return roteador;
};