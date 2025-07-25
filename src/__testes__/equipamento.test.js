// src/__testes__/equipamento.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

// Rotas
const usuarioRotas = require('../rotas/usuario.rotas');
const equipamentoRotas = require('../rotas/equipamento.rotas');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/equipamentos', equipamentoRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Equipamentos', () => {
  let token;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    
    const usuario = { nome: 'Utilizador Equipamento', email: `equip-${Date.now()}@teste.com`, senha: '12345678' };
    await request(app).post('/api/usuarios/registrar').send(usuario);
    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: usuario.senha });
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
      tipo: 'Instrumento'
    };

    const response = await request(app)
      .post('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoEquipamento);

    expect(response.status).toBe(201);
    expect(response.body.nome).toBe(novoEquipamento.nome);
    expect(response.body.marca).toBe(novoEquipamento.marca);
  });

  it('Deve criar um equipamento e gerar uma despesa automaticamente', async () => {
    const novoEquipamento = {
      nome: 'Mesa de Som',
      valor_compra: 1500.00,
      data_compra: new Date().toISOString(),
      gerar_despesa: true // Flag para automação
    };

    const response = await request(app)
      .post('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`)
      .send(novoEquipamento);

    expect(response.status).toBe(201);

    // Agora, verificamos se a despesa foi criada
    const { Transacao } = conexao.models;
    const despesa = await Transacao.findOne({ where: { descricao: `Compra de equipamento: ${novoEquipamento.nome}` } });
    
    expect(despesa).not.toBeNull();
    expect(parseFloat(despesa.valor)).toBe(novoEquipamento.valor_compra);
  });

  it('Deve listar os equipamentos do utilizador', async () => {
    await request(app).post('/api/equipamentos').set('Authorization', `Bearer ${token}`).send({ nome: 'Amplificador' });

    const response = await request(app)
      .get('/api/equipamentos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].nome).toBe('Amplificador');
  });
});