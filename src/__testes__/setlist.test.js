// src/__testes__/setlist.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas necessárias, incluindo a de músicas para os testes de estatísticas
const usuarioRotas = require('../rotas/usuario.rotas');
const setlistRotas = require('../rotas/setlist.rotas');
const musicaRotas = require('../rotas/musica.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/setlists', setlistRotas(conexao));
app.use('/api/musicas', musicaRotas(conexao)); // Registar a rota de músicas
app.use(tratadorDeErros);

describe('Testes das Rotas de Setlists', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Setlist', email: `setlist-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
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
    const buscaResponse = await request(app).get(`/api/setlists/${setlistId}`).set('Authorization', `Bearer ${token}`);
    expect(buscaResponse.status).toBe(404);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve retornar as estatísticas dos setlists do utilizador', async () => {
    // 1. CORREÇÃO: Garante que o utilizador tem o plano 'padrao' para poder criar músicas manuais
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });

    // 2. Criar dados de teste (agora com a permissão correta)
    await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${token}`).send({ nome: 'Música 1', artista: 'A' });
    await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${token}`).send({ nome: 'Música 2', artista: 'B' });
    await request(app).post('/api/setlists').set('Authorization', `Bearer ${token}`).send({ nome: 'Setlist 1' });

    // 3. Chamar a rota de estatísticas
    const response = await request(app)
      .get('/api/setlists/estatisticas')
      .set('Authorization', `Bearer ${token}`);

    // 4. Verificar a resposta
    expect(response.status).toBe(200);
    expect(response.body.totalMusicas).toBe(2);
    expect(response.body.totalSetlists).toBe(1);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve sugerir músicas com base no conteúdo de um setlist', async () => {
    // 1. CORREÇÃO: Garante que o utilizador tem o plano 'padrao'
    const { Usuario, Musica, Tag, Setlist } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });
    
    // 2. Criar Músicas e Tags
    const tagRock = await Tag.create({ nome: 'Rock' });
    const musica1 = await Musica.create({ nome: 'Musica Rock 1', artista: 'A', usuario_id: usuario.id });
    await musica1.addTag(tagRock);
    
    const musica2 = await Musica.create({ nome: 'Musica Rock 2', artista: 'B', usuario_id: usuario.id });
    await musica2.addTag(tagRock);
    
    await Musica.create({ nome: 'Musica Pop', artista: 'C', usuario_id: usuario.id });

    // 3. Criar um setlist e adicionar a primeira música
    const setlist = await Setlist.create({ nome: 'Setlist de Rock', usuario_id: usuario.id });
    await setlist.addMusica(musica1);

    // 4. Chamar a rota de sugestões
    const response = await request(app)
      .post(`/api/setlists/${setlist.id}/sugerir`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantidade: 5 });

    // 5. Verificar as sugestões
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].nome).toBe('Musica Rock 2');
  });
});