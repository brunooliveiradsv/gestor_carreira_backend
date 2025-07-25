// src/__testes__/contato.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

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
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Contato', email: `contato-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;
    
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo contato', async () => {
    const novoContato = { nome: 'Produtor Musical Teste', email: 'produtor@teste.com' };
    const response = await request(app)
      .post('/api/contatos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoContato);
    expect(response.status).toBe(201);
  });

  it('Deve buscar um contato específico por ID', async () => {
    const resCriacao = await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato para Buscar' });
    const contatoId = resCriacao.body.id;

    const response = await request(app)
      .get(`/api/contatos/${contatoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  it('Deve atualizar um contato existente', async () => {
    const resCriacao = await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Nome Antigo' });
    const contatoId = resCriacao.body.id;
    
    const dadosAtualizados = { nome: 'Nome Novo e Atualizado', funcao: 'Manager' };
    const response = await request(app)
      .put(`/api/contatos/${contatoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizados);
    expect(response.status).toBe(200);
  });
  
  // --- TESTE CORRIGIDO ---
  it('Deve definir um contato como público e os outros como não-públicos', async () => {
    // 1. CORREÇÃO: Atualiza o utilizador para um plano que permita mais de 1 contato
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao' }, { where: { id: usuario.id } });

    // 2. Agora podemos criar múltiplos contatos com sucesso
    const resContato1 = await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato A' });
    const resContato2 = await request(app).post('/api/contatos').set('Authorization', `Bearer ${token}`).send({ nome: 'Contato B' });
    const id1 = resContato1.body.id;
    const id2 = resContato2.body.id;

    // 3. Define o Contato B como público
    const response = await request(app)
      .patch(`/api/contatos/${id2}/definir-publico`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);

    // 4. Verifica o estado final na base de dados
    const { Contato } = conexao.models;
    const contato1DB = await Contato.findByPk(id1);
    const contato2DB = await Contato.findByPk(id2);

    expect(contato1DB.publico).toBe(false);
    expect(contato2DB.publico).toBe(true);
  });
});