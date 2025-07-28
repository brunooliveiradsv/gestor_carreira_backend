// src/__testes__/enquete.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');
const jwt = require('jsonwebtoken'); // Importa o JWT

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const enqueteRotas = require('../rotas/enquete.rotas');
const vitrineRotas = require('../rotas/vitrine.rotas');

// --- MOCK ADICIONADO ---
// Simula o middleware de autenticação de fãs
jest.mock('../middlewares/authFa.js', () => () => (req, res, next) => {
    req.fa = { id: 99, nome: 'Fã de Teste' };
    next();
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/enquetes', enqueteRotas(conexao));
app.use('/api/vitrine', vitrineRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Enquetes', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const dadosUsuario = {
        nome: 'Utilizador Enquete',
        email: `enquete-${Date.now()}@teste.com`,
        senha: '12345678', // A senha em texto plano para o login
        plano: 'premium',
        status_assinatura: 'ativa'
    };
    // O registro agora está dentro do controlador, então usamos a rota para criar
    await request(app).post('/api/usuarios/registrar').send(dadosUsuario);

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
    usuario = loginResponse.body.usuario;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma nova enquete com opções', async () => {
    const novaEnquete = { pergunta: 'Qual a sua música favorita?', opcoes: ['Música A', 'Música B'] };
    const response = await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send(novaEnquete);
    expect(response.status).toBe(201);
    expect(response.body.opcoes).toHaveLength(2);
  });

  it('Não deve criar uma enquete com menos de duas opções', async () => {
    const enqueteInvalida = { pergunta: 'Isto vai falhar?', opcoes: ['Apenas uma'] };
    const response = await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send(enqueteInvalida);
    expect(response.status).toBe(400);
  });

  it('Deve listar as enquetes do utilizador', async () => {
    await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send({ pergunta: 'P1', opcoes: ['a', 'b'] });
    const response = await request(app).get('/api/enquetes').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body[0].pergunta).toBe('P1');
  });

  it('Deve ativar uma enquete e desativar as outras', async () => {
    const enquete1Res = await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send({ pergunta: 'P1', opcoes: ['a', 'b'] });
    const enquete2Res = await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send({ pergunta: 'P2', opcoes: ['c', 'd'] });
    await request(app).patch(`/api/enquetes/${enquete1Res.body.id}/ativar`).set('Authorization', `Bearer ${token}`);
    await request(app).patch(`/api/enquetes/${enquete2Res.body.id}/ativar`).set('Authorization', `Bearer ${token}`);
    const { Enquete } = conexao.models;
    const enquete1DB = await Enquete.findByPk(enquete1Res.body.id);
    const enquete2DB = await Enquete.findByPk(enquete2Res.body.id);
    expect(enquete1DB.ativa).toBe(false);
    expect(enquete2DB.ativa).toBe(true);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve permitir que um fã autenticado vote numa opção da enquete', async () => {
    const enqueteRes = await request(app).post('/api/enquetes').set('Authorization', `Bearer ${token}`).send({ pergunta: 'P1', opcoes: ['Opção Voto', 'Outra'] });
    const idOpcao = enqueteRes.body.opcoes[0].id;
    
    // Cria um token de fã falso para simular o login
    const tokenFaFalso = jwt.sign({ id: 99, nome: 'Fã' }, process.env.JWT_SECRET);

    // O middleware mockado vai intercetar esta chamada e adicionar `req.fa`
    const votoRes = await request(app)
      .post(`/api/vitrine/enquetes/votar/${idOpcao}`)
      .set('Authorization-Fan', `Bearer ${tokenFaFalso}`); // Envia o header
      
    expect(votoRes.status).toBe(200);

    const { EnqueteOpcao } = conexao.models;
    const opcaoDB = await EnqueteOpcao.findByPk(idOpcao);
    expect(opcaoDB.votos).toBe(1);
  });
});