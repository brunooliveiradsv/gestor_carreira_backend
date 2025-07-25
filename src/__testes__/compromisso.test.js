// src/__testes__/compromisso.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Importa TODAS as rotas, pois podem ser necessárias dependências
const usuarioRotas = require('../rotas/usuario.rotas');
const compromissoRotas = require('../rotas/compromisso.rotas'); // A rota que vamos testar

const app = express();
app.use(cors());
app.use(express.json());
// Regista as rotas na app de teste
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/compromissos', compromissoRotas(conexao));
app.use(tratadorDeErros);


describe('Testes das Rotas de Compromissos', () => {
  let token; // Variável para guardar o token de autenticação

  // Antes de cada teste, cria um utilizador e faz login para obter um token fresco
  beforeEach(async () => {
    // Limpa a base de dados antes de cada teste para garantir isolamento
    await conexao.sync({ force: true }); 
    
    const usuario = { nome: 'Utilizador Compromisso', email: `comp-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo compromisso para um utilizador autenticado', async () => {
    const novoCompromisso = {
      tipo: 'Show',
      nome_evento: 'Show de Teste',
      data: new Date().toISOString(),
      local: 'Palco Teste',
      valor_cache: 500.00
    };

    const response = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`) // Usa o token obtido no beforeEach
      .send(novoCompromisso);

    expect(response.status).toBe(201);
    expect(response.body.nome_evento).toBe(novoCompromisso.nome_evento);
    expect(response.body.tipo).toBe('Show');
  });

  it('Deve listar os compromissos do utilizador autenticado', async () => {
    // Primeiro, cria um compromisso para ter algo para listar
     const novoCompromisso = { tipo: 'Ensaio', nome_evento: 'Ensaio Teste', data: new Date().toISOString() };
     await request(app).post('/api/compromissos').set('Authorization', `Bearer ${token}`).send(novoCompromisso);

    // Agora, lista os compromissos
    const response = await request(app)
        .get('/api/compromissos')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true); // Esperamos que a resposta seja um array
    expect(response.body.length).toBe(1); // Esperamos que tenha 1 compromisso
    expect(response.body[0].nome_evento).toBe(novoCompromisso.nome_evento);
  });
});