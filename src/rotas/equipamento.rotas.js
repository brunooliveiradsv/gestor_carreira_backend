// src/rotas/equipamento.rotas.js
const express = require("express");
const equipamentoControlador = require("../controladores/equipamento.controlador");
const authMiddleware = require("../middlewares/autenticacao");

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.use(authMiddleware(conexao));

  // --- ALTERAÇÕES AQUI ---
  // Adicionamos 'next' e passamo-lo para as funções do controlador
  roteador.post("/", (req, res, next) =>
    equipamentoControlador.criar(req, res, conexao, next)
  );
  roteador.get("/", (req, res, next) =>
    equipamentoControlador.listar(req, res, conexao, next)
  );
  roteador.get("/:id", (req, res, next) =>
    equipamentoControlador.buscarPorId(req, res, conexao, next)
  );
  roteador.put("/:id", (req, res, next) =>
    equipamentoControlador.atualizar(req, res, conexao, next)
  );
  roteador.delete("/:id", (req, res, next) =>
    equipamentoControlador.apagar(req, res, conexao, next)
  );

  return roteador;
};