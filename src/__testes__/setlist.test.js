// src/__testes__/setlist.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas necessárias
const usuarioRotas = require('../rotas/usuario.rotas');
const setlistRotas = require('../rotas/setlist.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/setlists', setlistRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Setlists', () => {
  let token;
  let usuarioId;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const usuario = { nome: 'Utilizador Setlist', email: `setlist-${Date.now()}@teste.com`, senha: '12345678' };
    const registroResponse = await request(app).post('/api/usuarios/registrar').send(usuario);
    usuarioId = registroResponse.body.usuario.id;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo setlist', async () => {
    const novoSetlist = { nome: 'Setlist Acústico' };

    const response = await request(app)
      .post('/api/setlists')
      .set('Authorization', `Bearer ${token}`)
      .send(novoSetlist);

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe(novoSetlist.nome);
    expect(response.body.usuario_id).toBe(usuarioId);
  });

  it('Deve listar os setlists do utilizador', async () => {
    await request(app).post('/api/setlists').set('Authorization', `Bearer ${token}`).send({ nome: 'Setlist Rock' });

    const response = await request(app)
      .get('/api/setlists')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nome).toBe('Setlist Rock');
  });

  it('Deve buscar um setlist por ID', async () => {
    const novoSetlistRes = await request(app).post('/api/setlists').set('Authorization', `Bearer ${token}`).send({ nome: 'Setlist para Ensaio' });
    const setlistId = novoSetlistRes.body.id;

    const response = await request(app)
      .get(`/api/setlists/${setlistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Setlist para Ensaio');
  });

  it('Deve atualizar um setlist', async () => {
    const novoSetlistRes = await request(app).post('/api/setlists').set('Authorization', `Bearer ${token}`).send({ nome: 'Nome Antigo' });
    const setlistId = novoSetlistRes.body.id;

    const dadosAtualizados = { nome: 'Nome Novo e Atualizado', notas_adicionais: 'Teste de notas.' };

    const response = await request(app)
      .put(`/api/setlists/${setlistId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizados);

    expect(response.status).toBe(200);
    expect(response.body.nome).toBe(dadosAtualizados.nome);
    expect(response.body.notas_adicionais).toBe(dadosAtualizados.notas_adicionais);
  });

  it('Deve apagar um setlist', async () => {
    const novoSetlistRes = await request(app).post('/api/setlists').set('Authorization', `Bearer ${token}`).send({ nome: 'Setlist para Apagar' });
    const setlistId = novoSetlistRes.body.id;

    const response = await request(app)
      .delete(`/api/setlists/${setlistId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Tenta buscar o setlist apagado para confirmar
    const buscaResponse = await request(app).get(`/api/setlists/${setlistId}`).set('Authorization', `Bearer ${token}`);
    expect(buscaResponse.status).toBe(404);
  });
});