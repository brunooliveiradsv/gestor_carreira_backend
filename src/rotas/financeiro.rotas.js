// src/rotas/financeiro.rotas.js
const express = require("express");
const financeiroControlador = require("../controladores/financeiro.controlador");
const authMiddleware = require("../middlewares/autenticacao");

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- ROTA NOVA PARA O GRÁFICO ---
  roteador.get("/balanco-mensal", (req, res, next) =>
    financeiroControlador.balancoUltimosMeses(req, res, conexao, next)
  );
  
  roteador.get("/resumo-mensal", (req, res, next) =>
    financeiroControlador.resumoMensal(req, res, conexao, next)
  );

  roteador.get("/transacoes", (req, res, next) =>
    financeiroControlador.listarTransacoes(req, res, conexao, next)
  );

  roteador.post('/transacoes', (req, res, next) => 
    financeiroControlador.criarTransacao(req, res, conexao, next)
  );

  return roteador;
};