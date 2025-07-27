// src/rotas/assinatura.rotas.js
const express = require('express');
const assinaturaControlador = require('../controladores/assinatura.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Todas as rotas de assinatura exigem que o usuário esteja logado
  roteador.use(authMiddleware(conexao));

  // --- CORREÇÃO: Adicionado 'next' a todas as chamadas do controlador ---

  // Rota para o usuário iniciar o período de teste gratuito
  roteador.post('/iniciar-teste', (req, res, next) => assinaturaControlador.iniciarTesteGratuito(req, res, conexao, next));

  roteador.post('/criar-sessao-checkout', (req, res, next) => assinaturaControlador.criarSessaoCheckout(req, res, conexao, next));

  roteador.put('/trocar-plano', (req, res, next) => assinaturaControlador.trocarPlano(req, res, conexao, next));

  // A função 'criarSessaoPortal' é a que estava a causar o erro, pois ela chama 'next(error)'
  roteador.post('/criar-sessao-portal', (req, res, next) => assinaturaControlador.criarSessaoPortal(req, res, conexao, next));

  return roteador;
};