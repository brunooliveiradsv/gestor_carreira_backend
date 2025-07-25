// src/__testes__/sugestao.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');
const bcrypt = require('bcryptjs');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const musicaRotas = require('../rotas/musica.rotas');
const adminRotas = require('../rotas/admin.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/musicas', musicaRotas(conexao));
app.use('/api/admin', adminRotas(conexao));
app.use(tratadorDeErros);

describe('Testes do Sistema de Sugestões de Músicas', () => {
  let userToken;
  let adminToken;
  let musicaMestre;
  let copiaDoUsuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    const { Usuario, Musica } = conexao.models;
    const senhaCriptografada = bcrypt.hashSync('senha123', 10);

    // Admin
    await Usuario.create({ nome: 'Admin Sugestao', email: 'admin.sugestao@teste.com', senha: senhaCriptografada, role: 'admin' });
    const adminLogin = await request(app).post('/api/usuarios/login').send({ email: 'admin.sugestao@teste.com', senha: 'senha123' });
    adminToken = adminLogin.body.token;
    
    // --- CORREÇÃO AQUI ---
    // Criamos o utilizador normal já com o plano 'padrao' e status 'ativa'.
    const user = await Usuario.create({
      nome: 'Utilizador Sugestao',
      email: `user.sugestao@teste.com`,
      senha: senhaCriptografada,
      plano: 'padrao', // Adiciona o plano necessário
      status_assinatura: 'ativa' // Garante que a assinatura está ativa
    });
    const userLogin = await request(app).post('/api/usuarios/login').send({ email: user.email, senha: 'senha123' });
    userToken = userLogin.body.token;

    // Música Mestre
    musicaMestre = await Musica.create({ nome: 'Música Original', artista: 'Artista Mestre', tom: 'C', is_publica: true });
    
    // Utilizador importa a música
    const importRes = await request(app).post('/api/musicas/importar').set('Authorization', `Bearer ${userToken}`).send({ master_id: musicaMestre.id });
    copiaDoUsuario = importRes.body;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve permitir que um utilizador crie uma sugestão para uma música importada', async () => {
    const sugestao = {
      campo_sugerido: 'tom',
      valor_sugerido: 'G'
    };

    const response = await request(app)
      .post(`/api/musicas/${copiaDoUsuario.id}/sugerir`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(sugestao);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pendente');
    expect(response.body.musica_id).toBe(musicaMestre.id);
  });

  it('NÃO deve permitir criar uma sugestão para uma música criada manualmente', async () => {
    const manualRes = await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${userToken}`).send({ nome: 'Minha Música', artista: 'Eu' });
    const musicaManual = manualRes.body;
    
    const response = await request(app)
      .post(`/api/musicas/${musicaManual.id}/sugerir`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ campo_sugerido: 'tom', valor_sugerido: 'Am' });

    expect(response.status).toBe(403);
  });
  
  it('O Admin deve conseguir aprovar uma sugestão e atualizar a música mestre', async () => {
    const sugestaoRes = await request(app)
      .post(`/api/musicas/${copiaDoUsuario.id}/sugerir`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ campo_sugerido: 'tom', valor_sugerido: 'D' });
    
    const sugestaoId = sugestaoRes.body.id;

    const aprovacaoRes = await request(app)
      .put(`/api/admin/sugestoes/${sugestaoId}/aprovar`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(aprovacaoRes.status).toBe(200);

    const { Musica, SugestaoMusica } = conexao.models;
    const mestreAtualizada = await Musica.findByPk(musicaMestre.id);
    const sugestaoAtualizada = await SugestaoMusica.findByPk(sugestaoId);

    expect(mestreAtualizada.tom).toBe('D');
    expect(sugestaoAtualizada.status).toBe('aprovada');
  });
});