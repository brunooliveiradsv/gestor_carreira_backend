// src/rotas/conquista.rotas.js
const express = require('express');
const conquistaControlador = require('../controladores/conquista.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  
  // Aplica o middleware de autenticação para todas as rotas de conquista
  roteador.use(authMiddleware(conexao));

  // Esta rota agora será a única para listar todas as conquistas do catálogo
  // combinadas com o status de desbloqueio e progresso do usuário.
  // Corresponde a GET /api/conquistas
  roteador.get('/', (req, res) => conquistaControlador.listarConquistasComProgresso(req, res, conexao));
  
  // As rotas antigas como /catalogo ou /minhasConquistas podem ser removidas
  // ou adaptadas se ainda houver alguma necessidade específica que a rota unificada não cubra.
  // Por exemplo, se você ainda precisa de um endpoint só para o catálogo sem dados do usuário.
  // roteador.get('/catalogo', (req, res) => conquistaControlador.listarCatalogo(req, res, conexao));
  
  return roteador;
};