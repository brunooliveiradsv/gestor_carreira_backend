// src/rotas/contato.rotas.js
const express = require('express');
const contatoControlador = require('../controladores/contato.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const limiteRecurso = require('../middlewares/limiteRecurso');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  roteador.post('/', limiteRecurso('contatos', conexao.models.Contato), (req, res) => contatoControlador.criar(req, res, conexao));
  roteador.get('/', (req, res) => contatoControlador.listar(req, res, conexao));
  roteador.get('/:id', (req, res) => contatoControlador.buscarPorId(req, res, conexao));
  roteador.put('/:id', (req, res) => contatoControlador.atualizar(req, res, conexao));
  roteador.delete('/:id', (req, res) => contatoControlador.apagar(req, res, conexao));
  
  // --- ROTA ADICIONADA ---
  // O método PATCH é semanticamente correto para atualizações parciais
  roteador.patch('/:id/definir-publico', (req, res) => contatoControlador.definirComoPublico(req, res, conexao));
  
  return roteador;
};