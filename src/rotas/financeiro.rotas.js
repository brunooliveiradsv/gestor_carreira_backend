// src/rotas/financeiro.rotas.js
const express = require("express");
const financeiroControlador = require("../controladores/financeiro.controlador");
const authMiddleware = require("../middlewares/autenticacao");

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.use(authMiddleware(conexao));

  // --- NOVA ROTA PARA O DASHBOARD ---
  roteador.get("/resumo-mensal", (req, res) =>
    financeiroControlador.resumoMensal(req, res, conexao)
  );

  roteador.get("/transacoes", (req, res) =>
    financeiroControlador.listarTransacoes(req, res, conexao)
  );

  roteador.post('/transacoes', (req, res) => financeiroControlador.criarTransacao(req, res, conexao));

  return roteador;
};