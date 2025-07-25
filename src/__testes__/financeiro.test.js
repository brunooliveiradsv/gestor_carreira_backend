// src/__testes__/financeiro.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const financeiroRotas = require('../rotas/financeiro.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/financeiro', financeiroRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas Financeiras', () => {
  let token;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const usuario = { nome: 'Utilizador Financeiro', email: `fin-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma nova transação de receita', async () => {
    const novaReceita = {
      descricao: 'Cachê do show de teste',
      valor: 750.50,
      tipo: 'receita',
      data: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/financeiro/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaReceita);

    expect(response.status).toBe(201);
    expect(response.body.descricao).toBe(novaReceita.descricao);
    expect(parseFloat(response.body.valor)).toBe(novaReceita.valor);
  });

  it('Deve criar uma nova transação de despesa', async () => {
    const novaDespesa = {
      descricao: 'Cordas de guitarra novas',
      valor: 80.00,
      tipo: 'despesa',
      data: new Date().toISOString(),
      categoria: 'Equipamento'
    };

    const response = await request(app)
      .post('/api/financeiro/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send(novaDespesa);

    expect(response.status).toBe(201);
    expect(response.body.tipo).toBe('despesa');
  });

  it('Deve listar as transações e o resumo mensal', async () => {
    // Adiciona uma receita e uma despesa
    await request(app).post('/api/financeiro/transacoes').set('Authorization', `Bearer ${token}`).send({ descricao: 'R1', valor: 1000, tipo: 'receita', data: new Date() });
    await request(app).post('/api/financeiro/transacoes').set('Authorization', `Bearer ${token}`).send({ descricao: 'D1', valor: 300, tipo: 'despesa', data: new Date() });

    // Testa a listagem
    const transacoesRes = await request(app).get('/api/financeiro/transacoes').set('Authorization', `Bearer ${token}`);
    expect(transacoesRes.status).toBe(200);
    expect(transacoesRes.body.length).toBe(2);

    // Testa o resumo
    const resumoRes = await request(app).get('/api/financeiro/resumo-mensal').set('Authorization', `Bearer ${token}`);
    expect(resumoRes.status).toBe(200);
    expect(resumoRes.body.totalReceitas).toBe(1000);
    expect(resumoRes.body.totalDespesas).toBe(300);
    expect(resumoRes.body.saldo).toBe(700);
  });
});