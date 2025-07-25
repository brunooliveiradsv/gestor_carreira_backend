// src/__testes__/assinatura.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe'); // Importa o stripe, que será o nosso mock
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

const usuarioRotas = require('../rotas/usuario.rotas');
const assinaturaRotas = require('../rotas/assinatura.rotas');
const webhookRotas = require('../rotas/webhook.rotas');

// --- SIMULAÇÃO FINAL E CORRETA ---
// 1. Criamos um objeto de simulação partilhado com todas as funções necessárias.
const mockStripeInstance = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
};

// 2. Dizemos ao Jest que, quando o módulo 'stripe' for importado,
// ele deve ser uma função que SEMPRE retorna o nosso objeto partilhado (mockStripeInstance).
jest.mock('stripe', () => jest.fn(() => mockStripeInstance));

const app = express();
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(cors());
app.use(express.json());
app.use('/api/usuarios', usuarioRotas(conexao));
app.use('/api/assinatura', assinaturaRotas(conexao));
app.use('/webhook', webhookRotas(conexao));
app.use(tratadorDeErros);

describe('Testes das Rotas de Assinatura e Webhooks', () => {
  let token;
  let usuario;

  beforeEach(async () => {
    // 3. Limpa todos os mocks antes de cada teste para garantir isolamento.
    jest.clearAllMocks();
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Assinatura', email: `sub-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: usuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma sessão de checkout do Stripe', async () => {
    const sessaoFalsa = { url: 'https://checkout.stripe.com/pay/cs_test_12345' };
    // 4. Configura o nosso objeto de simulação diretamente.
    mockStripeInstance.checkout.sessions.create.mockResolvedValue(sessaoFalsa);

    const response = await request(app)
      .post('/api/assinatura/criar-sessao-checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ planoId: 'price_xxxxxxxx' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(sessaoFalsa.url);
    expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('Deve atualizar o plano do utilizador quando o webhook de checkout.session.completed for recebido', async () => {
    const eventoFalso = {
      id: 'evt_123', object: 'event', type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123', client_reference_id: usuario.id, customer: 'cus_12345', subscription: 'sub_12345'
        }
      }
    };
    const subscricaoFalsa = {
      items: { data: [{ price: { id: process.env.STRIPE_PRICE_ID_PREMIUM_MENSAL || 'price_premium_mensal_teste' } }] }
    };

    mockStripeInstance.webhooks.constructEvent.mockReturnValue(eventoFalso);
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue(subscricaoFalsa);

    await request(app)
      .post('/webhook')
      .set('stripe-signature', 'assinatura_falsa')
      .send(Buffer.from(JSON.stringify(eventoFalso)));

    const { Usuario } = conexao.models;
    const utilizadorAtualizado = await Usuario.findByPk(usuario.id);

    expect(utilizadorAtualizado.plano).toBe('premium');
    expect(utilizadorAtualizado.status_assinatura).toBe('ativa');
    expect(utilizadorAtualizado.stripe_customer_id).toBe('cus_12345');
  });
});