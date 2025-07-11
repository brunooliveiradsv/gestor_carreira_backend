const express = require('express');
const notificacaoControlador = require('../controladores/notificacao.controlador');
const authMiddleware = require('../middlewares/autenticacao');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  roteador.get('/', (req, res) => notificacaoControlador.listar(req, res, conexao));
  roteador.patch('/:id/lida', (req, res) => notificacaoControlador.marcarComoLida(req, res, conexao));
  roteador.delete('/:id', (req, res) => notificacaoControlador.apagar(req, res, conexao));
  roteador.delete('/', (req, res) => notificacaoControlador.limparTodas(req, res, conexao));
  
  return roteador;
};