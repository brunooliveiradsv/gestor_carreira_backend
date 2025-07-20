// src/rotas/setlist.rotas.js
const express = require('express');
const setlistControlador = require('../controladores/setlist.controlador');
const authMiddleware = require('../middlewares/autenticacao');
const assinaturaMiddleware = require('../middlewares/assinatura');

module.exports = (conexao) => {
  const roteador = express.Router();
  roteador.use(authMiddleware(conexao));

  // --- ROTAS DO DASHBOARD E GERAIS ---
  // Rota para as estatísticas da "Central de Comando"
  roteador.get('/estatisticas', (req, res) => setlistControlador.estatisticas(req, res, conexao));
  
  // Lista todos os setlists do usuário
  roteador.get('/', (req, res) => setlistControlador.listar(req, res, conexao));
  
  // Cria um novo setlist (ainda sem músicas)
  roteador.post('/', assinaturaMiddleware(), (req, res) => setlistControlador.criar(req, res, conexao));

  // --- ROTAS ESPECÍFICAS DE UM SETLIST ---
  // Busca um setlist específico, já com as músicas ordenadas
  roteador.get('/:id', (req, res) => setlistControlador.buscarPorId(req, res, conexao));
  
  // Atualiza os dados básicos de um setlist (nome, notas, etc.)
  roteador.put('/:id', (req, res) => setlistControlador.atualizar(req, res, conexao));
  
  // Apaga um setlist e suas associações
  roteador.delete('/:id', (req, res) => setlistControlador.apagar(req, res, conexao));

  // --- ROTAS DE MANIPULAÇÃO DE MÚSICAS NO SETLIST ---
  // Adiciona, remove e reordena as músicas de um setlist
  roteador.put('/:id/musicas', (req, res) => setlistControlador.atualizarMusicas(req, res, conexao));
  
  // A "mágica": sugere músicas para completar um setlist
  roteador.post('/:id/sugerir', (req, res) => setlistControlador.sugerirMusicas(req, res, conexao));

  return roteador;
};