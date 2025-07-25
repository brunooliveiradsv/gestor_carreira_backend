// src/__testes__/conquista.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// --- ROTAS ADICIONADAS ---
// Agora importamos todas as rotas necessárias para acionar as diferentes conquistas
const usuarioRotas = require('../rotas/usuario.rotas');
const conquistaRotas = require('../rotas/conquista.rotas');
const contatoRotas = require('../rotas/contato.rotas');
const compromissoRotas = require('../rotas/compromisso.rotas');
const financeiroRotas = require('../rotas/financeiro.rotas');

const app = express();
app.use(cors());
app.use(express.json());
// Registamos todas as rotas na nossa aplicação de teste
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/conquistas', conquistaRotas(conexao));
app.use('/api/contatos', contatoRotas(conexao));
app.use('/api/compromissos', compromissoRotas(conexao));
app.use('/api/financeiro', financeiroRotas(conexao));
app.use(tratadorDeErros);

describe('Testes do Sistema de Conquistas', () => {
  let token;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    const seeder = require('../../seeders/20250707103229-popular-conquistas');
    await seeder.up(conexao.getQueryInterface());

    const usuario = { nome: 'Caçador de Conquistas', email: `conquista-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve desbloquear a conquista "Quebrando o Gelo" após criar o primeiro contato', async () => {
    await request(app)
      .post('/api/contatos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Primeiro Contato Teste', email: 'contato@teste.com' });

    const response = await request(app)
      .get('/api/conquistas')
      .set('Authorization', `Bearer ${token}`);

    const conquista = response.body.find(c => c.nome === 'Quebrando o Gelo');
    expect(conquista).toBeDefined();
    expect(conquista.desbloqueada).toBe(true);
  });
  
  // --- NOVO TESTE ---
  it('Deve desbloquear a conquista "Primeiros Passos" após criar o primeiro compromisso', async () => {
    // 1. Ação: Criar um compromisso
    await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'Ensaio', nome_evento: 'Ensaio da banda', data: new Date() });

    // 2. Verificação
    const response = await request(app)
      .get('/api/conquistas')
      .set('Authorization', `Bearer ${token}`);
    
    const conquista = response.body.find(c => c.nome === 'Primeiros Passos');
    expect(conquista).toBeDefined();
    expect(conquista.desbloqueada).toBe(true);
  });

  // --- NOVO TESTE ---
  it('Deve desbloquear a conquista "Primeiro Cachê" após lançar a primeira receita de um show', async () => {
    // 1. Ação (Parte 1): Criar um compromisso do tipo "Show" para termos um ID válido
    const compromissoRes = await request(app)
      .post('/api/compromissos')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipo: 'Show', nome_evento: 'Show de Teste de Conquista', data: new Date() });
    
    const compromissoId = compromissoRes.body.id;

    // 2. Ação (Parte 2): Criar uma transação de receita associada a esse show
    await request(app)
      .post('/api/financeiro/transacoes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        descricao: 'Cachê do show',
        valor: 500,
        tipo: 'receita',
        data: new Date(),
        compromisso_id: compromissoId // Associa a receita ao show
      });

    // 3. Verificação
    const response = await request(app)
      .get('/api/conquistas')
      .set('Authorization', `Bearer ${token}`);

    const conquista = response.body.find(c => c.nome === 'Primeiro Cachê');
    expect(conquista).toBeDefined();
    expect(conquista.desbloqueada).toBe(true);
  });
});