// src/rotas/equipamento.rotas.js
const express = require("express");
const equipamentoControlador = require("../controladores/equipamento.controlador");
const authMiddleware = require("../middlewares/autenticacao");

module.exports = (conexao) => {
  const roteador = express.Router();

  roteador.use(authMiddleware(conexao));

  roteador.post("/", (req, res) =>
    equipamentoControlador.criar(req, res, conexao)
  );
  roteador.get("/", (req, res) =>
    equipamentoControlador.listar(req, res, conexao)
  );

  // --- ROTA NOVA ---
  // Rota para buscar um equipamento específico pelo seu ID
  roteador.get("/:id", (req, res) =>
    equipamentoControlador.buscarPorId(req, res, conexao)
  );
  roteador.put("/:id", (req, res) =>
    equipamentoControlador.atualizar(req, res, conexao)
  );
  roteador.delete("/:id", (req, res) =>
    equipamentoControlador.apagar(req, res, conexao)
  );

  return roteador;
};
