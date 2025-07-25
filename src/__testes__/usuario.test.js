// src/__testes__/usuario.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');
const usuarioRotas = require('../rotas/usuario.rotas');

// --- SIMULAÇÕES (MOCKS) ---
// Colocamos todos os mocks no topo do ficheiro para que o Jest os possa "içar" (hoist) corretamente.
jest.mock('nodemailer');
jest.mock('multer-storage-cloudinary');

// Simulação mais robusta do Multer para uploads
jest.mock('multer', () => {
    const multer = jest.requireActual('multer');
    return jest.fn(() => ({
        single: jest.fn().mockImplementation(fieldName => (req, res, next) => {
            req.file = {
                path: 'https://res.cloudinary.com/fake-cloud/image/upload/fake_image.jpg',
                fieldname: fieldName,
            };
            next();
        }),
        array: jest.fn().mockImplementation((fieldName, maxCount) => (req, res, next) => {
            req.files = [{
                path: 'https://res.cloudinary.com/fake-cloud/image/upload/fake_cover_1.jpg',
            }];
            next();
        }),
    }));
});


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use(tratadorDeErros);

// --- UM ÚNICO BLOCO `DESCRIBE` PARA TODOS OS TESTES DE UTILIZADOR ---
describe('Testes das Rotas de Usuário', () => {
  let token;
  let emailDoUtilizador;
  const senhaOriginal = 'senhaForte123';

  beforeEach(async () => {
    await conexao.sync({ force: true });
    emailDoUtilizador = `perfil-${Date.now()}@teste.com`;
    const usuario = { nome: 'Utilizador Perfil', email: emailDoUtilizador, senha: senhaOriginal };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: emailDoUtilizador, senha: senhaOriginal });
    token = loginResponse.body.token;
  });

  // afterAll é executado apenas uma vez, no final de todos os testes deste ficheiro
  afterAll(async () => {
    await conexao.close();
  });
  
  // --- Testes de Autenticação e Registo ---
  it('Deve registar um novo utilizador com sucesso', async () => {
      const novoUsuario = { nome: 'Novo Registo', email: 'novo@email.com', senha: 'password123' };
      const response = await request(app).post('/api/usuarios/registrar').send(novoUsuario);
      expect(response.status).toBe(201);
  });

  it('Deve autenticar um utilizador com credenciais válidas', async () => {
    const response = await request(app).post('/api/usuarios/login').send({ email: emailDoUtilizador, senha: senhaOriginal });
    expect(response.status).toBe(200);
  });

  it('Deve enviar um e-mail de recuperação de senha', async () => {
    const response = await request(app).post('/api/usuarios/recuperar-senha').send({ email: emailDoUtilizador });
    expect(response.status).toBe(200);
  });

  // --- Testes de Perfil e Atualizações ---
  it('Deve retornar os dados do perfil para um utilizador autenticado', async () => {
    const response = await request(app).get('/api/usuarios/perfil').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
  
  it('Deve permitir que um utilizador atualize a sua própria senha', async () => {
    const response = await request(app)
      .put('/api/usuarios/perfil/senha')
      .set('Authorization', `Bearer ${token}`)
      .send({ senhaAtual: senhaOriginal, novaSenha: 'novaSenhaSuperForte456' });
    expect(response.status).toBe(200);
  });
  
  it('Deve permitir que um utilizador premium atualize o seu perfil público', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'premium' }, { where: { email: emailDoUtilizador } });
    
    const dadosPublicos = { biografia: 'Uma nova biografia.', url_unica: 'artista-unico' };
    const response = await request(app)
      .put('/api/usuarios/perfil/publico')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosPublicos);
    
    expect(response.status).toBe(200);
  });
  
  // --- Teste de Upload de Foto (agora dentro do mesmo describe) ---
  it('Deve permitir que um utilizador atualize a sua foto de perfil', async () => {
    const response = await request(app)
      .put('/api/usuarios/perfil/foto')
      .set('Authorization', `Bearer ${token}`)
      .attach('foto', Buffer.from('dummy content'), 'teste-avatar.png');

    expect(response.status).toBe(200);
    expect(response.body.foto_url).toBe('https://res.cloudinary.com/fake-cloud/image/upload/fake_image.jpg');
  });
});