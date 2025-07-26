// src/__testes__/vitrine.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');
const jwt = require('jsonwebtoken'); // Importa o JWT para criar um token falso

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const vitrineRotas = require('../rotas/vitrine.rotas');

// Mock do middleware de autenticação de fãs
jest.mock('../middlewares/authFa.js', () => () => (req, res, next) => {
    // Adiciona um objeto de fã falso ao request
    req.fa = { id: 99, nome: 'Fã de Teste', email: 'fa@teste.com' };
    next();
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/vitrine', vitrineRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas da Vitrine (Showcase)', () => {
  // ... (o beforeEach e afterAll continuam iguais)
  beforeEach(async () => { await conexao.sync({ force: true }); });
  afterAll(async () => { await conexao.close(); });

  // ... (os testes de exibir/não exibir vitrine continuam iguais)
  it('Deve exibir a vitrine de um utilizador premium', async () => { /* ... */ });
  it('Não deve exibir a vitrine de um utilizador que não seja premium', async () => { /* ... */ });

  // --- TESTE CORRIGIDO ---
  it('Deve permitir que um fã autenticado aplauda um artista', async () => {
    const { Usuario } = conexao.models;
    const novoUsuario = await Usuario.create({
        nome: 'Artista Aplaudido', email: 'aplauso@teste.com', senha: '123',
        plano: 'premium', status_assinatura: 'ativa', url_unica: 'artista-aplaudido',
        aplausos: 10
    });
    
    // Criamos um token de fã falso para a requisição
    const tokenFaFalso = jwt.sign({ id: 99, nome: 'Fã' }, process.env.JWT_SECRET);

    const response = await request(app)
        .post(`/api/vitrine/${novoUsuario.url_unica}/aplaudir`)
        // Adiciona o cabeçalho de autenticação do fã
        .set('Authorization-Fan', `Bearer ${tokenFaFalso}`);

    expect(response.status).toBe(200);
    
    // Recarrega o artista da base de dados para verificar o novo total de aplausos
    await novoUsuario.reload();
    expect(novoUsuario.aplausos).toBe(11);
  });
});