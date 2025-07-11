// src/rotas/financeiro.rotas.js
const express = require("express");
const financeiroControlador = require("../controladores/financeiro.controlador");
const authMiddleware = require("../middlewares/autenticacao");

module.exports = (conexao) => {
  const roteador = express.Router();

  // Esta linha aplica o "segurança" de autenticação a todas as rotas deste arquivo.
  // Ela garante que 'req.usuario' existirá antes de chamar o controlador.
    roteador.use(authMiddleware(conexao));

  // Rota para listar as transações do usuário logado
  roteador.get("/transacoes", (req, res) =>
    financeiroControlador.listarTransacoes(req, res, conexao)
  );

   // Rota para criar uma nova transação manual
  roteador.post('/transacoes', (req, res) => financeiroControlador.criarTransacao(req, res, conexao));

  return roteador;
};
