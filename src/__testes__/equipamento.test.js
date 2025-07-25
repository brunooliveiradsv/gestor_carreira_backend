// src/__testes__/equipamento.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const equipamentoRotas = require('../rotas/equipamento.rotas');
const financeiroRotas = require('../rotas/financeiro.rotas'); // Necessário para verificar a despesa

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/equipamentos', equipamentoRotas(conexao));
app.use('/api/financeiro', financeiroRotas(conexao)); // Registar para acesso ao modelo Transacao
app.use(tratadorDeErros);

describe('Testes das Rotas de Equipamentos', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Equipamento', email: `equip-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;
    
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar um novo equipamento', async () => {
    const novoEquipamento = {
      nome: 'Guitarra Elétrica',
      marca: 'Fender',
      modelo: 'Stratocaster',
    };

    const response = await request(app)
      .post('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoEquipamento);

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe(novoEquipamento.nome);
  });

  it('Deve criar um equipamento e gerar uma despesa automaticamente', async () => {
    const novoEquipamento = {
      nome: 'Mesa de Som',
      valor_compra: 1500.00,
      data_compra: new Date().toISOString(),
      gerar_despesa: true // Flag para a automação
    };

    const response = await request(app)
      .post('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoEquipamento);

    expect(response.status).toBe(201);

    // Verifica se a transação de despesa foi criada na base de dados
    const { Transacao } = conexao.models;
    const despesa = await Transacao.findOne({ where: { usuario_id: usuario.id } });
    
    expect(despesa).not.toBeNull();
    expect(despesa.descricao).toBe(`Compra de equipamento: ${novoEquipamento.nome}`);
    expect(parseFloat(despesa.valor)).toBe(novoEquipamento.valor_compra);
  });

  it('Deve listar os equipamentos do utilizador', async () => {
    // Utilizador free pode criar 1 equipamento
    await request(app).post('/api/equipamentos').set('Authorization', `Bearer ${token}`).send({ nome: 'Amplificador' });

    const response = await request(app)
      .get('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].nome).toBe('Amplificador');
  });

  it('Deve atualizar um equipamento existente', async () => {
    const resCriacao = await request(app).post('/api/equipamentos').set('Authorization', `Bearer ${token}`).send({ nome: 'Nome Antigo' });
    const equipamentoId = resCriacao.body.id;

    const dadosAtualizados = { nome: 'Nome Novo e Atualizado', notas: 'Manutenção feita.' };
    const response = await request(app)
      .put(`/api/equipamentos/${equipamentoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAtualizados);
      
    expect(response.status).toBe(200);
    expect(response.body.nome).toBe(dadosAtualizados.nome);
    expect(response.body.notas).toBe(dadosAtualizados.notas);
  });
});