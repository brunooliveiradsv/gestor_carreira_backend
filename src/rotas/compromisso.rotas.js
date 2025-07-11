// src/rotas/compromisso.rotas.js
const express = require('express');
const compromissoControlador = require('../controladores/compromisso.controlador');
const authMiddleware = require('../middlewares/autenticacao'); // Nosso "segurança"

module.exports = (conexao) => {
  const roteador = express.Router();

  // A MUDANÇA: Dizemos para TODAS as rotas deste arquivo usarem o middleware de autenticação.
  // O "segurança" vai barrar qualquer um sem um token válido.
  roteador.use(authMiddleware(conexao));

  // Rota para criar um novo compromisso
  roteador.post('/', (req, res) => compromissoControlador.criar(req, res, conexao));

  // Rota para listar todos os compromissos do usuário logado
  roteador.get('/', (req, res) => compromissoControlador.listar(req, res, conexao));

  roteador.get('/:id', (req, res) => compromissoControlador.buscarPorId(req, res, conexao));

  // Rota para atualizar um compromisso específico pelo seu ID
  roteador.put('/:id', (req, res) => compromissoControlador.atualizar(req, res, conexao));

  // Rota para apagar um compromisso específico pelo seu ID
  roteador.delete('/:id', (req, res) => compromissoControlador.apagar(req, res, conexao));
  
  // (No futuro, adicionaremos as rotas GET, PUT, DELETE aqui dentro)

  return roteador;
};