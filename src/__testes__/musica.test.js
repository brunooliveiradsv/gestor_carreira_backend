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
    
    usuario = { nome: 'Utilizador Musica', email: `musica-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma música manualmente no repertório do utilizador', async () => {
    // Para este teste, vamos simular que o utilizador tem plano 'padrão' ou superior
    // Atualizando o plano do nosso utilizador de teste diretamente na base de dados
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { email: usuario.email } });

    const novaMusica = {
      nome: 'Wonderwall',
      artista: 'Oasis',
      tom: 'F#m'
    };

    const response = await request(app)
      .post('/api/musicas/manual')
      .set('Authorization', `Bearer ${token}`)
      .send(novaMusica);
    
    expect(response.status).toBe(201);
    expect(response.body.nome).toBe('Wonderwall');
    expect(response.body.master_id).toBeNull();
  });

  it('Deve importar uma música pública para o repertório do utilizador', async () => {
    // 1. Criar uma música "mestre" pública diretamente na base de dados para o teste
    const { Musica } = conexao.models;
    const musicaMestre = await Musica.create({
        nome: 'Smells Like Teen Spirit',
        artista: 'Nirvana',
        is_publica: true,
        master_id: null
    });

    // 2. Tentar importar essa música
    const response = await request(app)
        .post('/api/musicas/importar')
        .set('Authorization', `Bearer ${token}`)
        .send({ master_id: musicaMestre.id });

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe(musicaMestre.nome);
    expect(response.body.master_id).toBe(musicaMestre.id); // Confirma que está linkada à mestre
    expect(response.body.is_publica).toBe(false); // A cópia do utilizador é privada
  });

  it('Deve listar as músicas do repertório do utilizador', async () => {
    // Adiciona uma música manualmente
    const { Usuario, Musica } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { email: usuario.email } });
    await request(app).post('/api/musicas/manual').set('Authorization', `Bearer ${token}`).send({ nome: 'Musica Manual', artista: 'Artista 1' });

    // Adiciona uma música importada
    const musicaMestre = await Musica.create({ nome: 'Musica Mestre', artista: 'Artista 2', is_publica: true });
    await request(app).post('/api/musicas/importar').set('Authorization', `Bearer ${token}`).send({ master_id: musicaMestre.id });
    
    // Lista o repertório
    const response = await request(app)
        .get('/api/musicas')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });
});