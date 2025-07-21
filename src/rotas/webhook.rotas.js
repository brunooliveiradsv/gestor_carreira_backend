// src/rotas/webhook.rotas.js
const express = require('express');
const webhookControlador = require('../controladores/webhook.controlador');

module.exports = (conexao) => {
  const roteador = express.Router();

  // Rota especial que recebe os eventos do Stripe
  roteador.post('/', express.raw({type: 'application/json'}), (req, res) => webhookControlador.handleStripeWebhook(req, res, conexao));

  return roteador;
};