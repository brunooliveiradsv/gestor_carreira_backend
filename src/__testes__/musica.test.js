// src/__testes__/musica.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const musicaRotas = require('../rotas/musica.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/musicas', musicaRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Músicas', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Musica', email: `musica-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma música manualmente no repertório do utilizador', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });

    const novaMusica = { nome: 'Wonderwall', artista: 'Oasis', tom: 'F#m' };
    const response = await request(app)
      .post('/api/musicas/manual')
      .set('Authorization', `Bearer ${token}`)
      .send(novaMusica);
    
    expect(response.status).toBe(201);
    expect(response.body.nome).toBe('Wonderwall');
  });

  it('Deve importar uma música pública para o repertório do utilizador', async () => {
    const { Musica } = conexao.models;
    const musicaMestre = await Musica.create({ nome: 'Smells Like Teen Spirit', artista: 'Nirvana', is_publica: true });

    const response = await request(app)
        .post('/api/musicas/importar')
        .set('Authorization', `Bearer ${token}`)
        .send({ master_id: musicaMestre.id });

    expect(response.status).toBe(201);
    expect(response.body.master_id).toBe(musicaMestre.id);
  });
  
  // --- NOVO TESTE ---
  it('Deve atualizar uma música do repertório', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });
    const resCriacao = await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${token}`).send({ nome: 'Nome Antigo', artista: 'Artista' });
    const musicaId = resCriacao.body.id;

    const dadosAtualizados = { tom: 'G', bpm: 120 };
    const resAtualizacao = await request(app)
      .put(`/api/musicas/${musicaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizados);
      
    expect(resAtualizacao.status).toBe(200);
    expect(resAtualizacao.body.tom).toBe('G');
    expect(resAtualizacao.body.bpm).toBe(120);
  });

  // --- NOVO TESTE ---
  it('Deve apagar uma música do repertório', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });
    const resCriacao = await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${token}`).send({ nome: 'Para Apagar', artista: 'Artista' });
    const musicaId = resCriacao.body.id;

    const resDelete = await request(app)
      .delete(`/api/musicas/${musicaId}`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(resDelete.status).toBe(204);

    const resBusca = await request(app).get(`/api/musicas/${musicaId}`).set('Authorization', `Bearer ${token}`);
    expect(resBusca.status).toBe(404);
  });

  // --- NOVO TESTE ---
  it('Deve sincronizar uma cópia do utilizador com as alterações da música mestre', async () => {
    const { Musica } = conexao.models;
    // 1. Cria a mestre e a cópia do utilizador
    const musicaMestre = await Musica.create({ nome: 'Musica Mestre', artista: 'Original', tom: 'C', bpm: 100, is_publica: true });
    const resImport = await request(app).post('/api/musicas/importar').set('Authorization', `Bearer ${token}`).send({ master_id: musicaMestre.id });
    const copiaId = resImport.body.id;

    // 2. Altera a música mestre diretamente na BD (simula uma atualização do admin)
    await musicaMestre.update({ tom: 'D', bpm: 110 });

    // 3. Chama a rota de sincronização
    const resSincronizacao = await request(app)
      .post(`/api/musicas/${copiaId}/sincronizar`)
      .set('Authorization', `Bearer ${token}`);

    // 4. Verifica se a cópia do utilizador foi atualizada
    expect(resSincronizacao.status).toBe(200);
    expect(resSincronizacao.body.tom).toBe('D');
    expect(resSincronizacao.body.bpm).toBe(110);
  });
});