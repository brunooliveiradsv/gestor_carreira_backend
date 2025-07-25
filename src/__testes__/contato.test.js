// src/__testes__/contato.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const contatoRotas = require('../rotas/contato.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/contatos', contatoRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Contatos', () => {
  let token;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const usuario = { nome: 'Utilizador Contato', email: `contato-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo contato', async () => {
    const novoContato = {
      nome: 'Produtor Musical Teste',
      email: 'produtor@teste.com',
      funcao: 'Produtor'
    };

    const response = await request(app)
      .post('/api/contatos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoContato);

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe(novoContato.nome);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve listar o contato do utilizador', async () => {
    // Cria apenas UM contato, que é o limite do plano 'free'
    await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato 1' });

    const response = await request(app)
      .get('/api/contatos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // A asserção agora espera corretamente um array com 1 elemento
    expect(response.body.length).toBe(1);
  });
  
  // --- NOVO TESTE ---
  it('Não deve permitir criar um segundo contato para um utilizador do plano free', async () => {
    // Cria o primeiro contato com sucesso
    await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato Permitido' });

    // Tenta criar o segundo contato
    const response = await request(app)
      .post('/api/contatos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Contato Bloqueado' });

    // Verifica se a API retornou o erro de "Acesso Negado" (Forbidden)
    expect(response.status).toBe(403);
    expect(response.body.upgradeNecessario).toBe(true);
  });

   it('Deve apagar um contato', async () => {
    const novoContatoRes = await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato para Apagar' });
    const contatoId = novoContatoRes.body.id;

    const response = await request(app)
      .delete(`/api/contatos/${contatoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});