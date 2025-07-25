// src/__testes__/tratadorDeErros.test.js
const request = require('supertest');
const express = require('express');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

describe('Testes do Middleware Tratador de Erros', () => {
  let app;

  // Antes de cada teste, criamos uma nova instância da aplicação Express
  beforeEach(() => {
    app = express();

    // Rota que causa um erro padrão (deve resultar num status 500)
    app.get('/erro-padrao', (req, res, next) => {
      // Força um erro síncrono
      throw new Error('Este é um erro de teste padrão.');
    });

    // Rota que causa um erro com um statusCode customizado
    app.get('/erro-customizado', (req, res, next) => {
      const erro = new Error('Página não encontrada.');
      erro.statusCode = 404; // Adiciona um status code ao erro
      // Passa o erro para o próximo middleware (o nosso tratador)
      next(erro);
    });

    // IMPORTANTE: O tratador de erros é o último middleware a ser registado
    app.use(tratadorDeErros);
  });

  it('Deve apanhar um erro padrão e retornar um status 500', async () => {
    const response = await request(app).get('/erro-padrao');

    expect(response.status).toBe(500);
    expect(response.body.mensagem).toBe('Este é um erro de teste padrão.');
  });

  it('Deve apanhar um erro com statusCode customizado e retornar esse status', async () => {
    const response = await request(app).get('/erro-customizado');

    expect(response.status).toBe(404);
    expect(response.body.mensagem).toBe('Página não encontrada.');
  });
});