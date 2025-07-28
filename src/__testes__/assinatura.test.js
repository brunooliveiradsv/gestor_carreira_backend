// src/__testes__/assinatura.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe');
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

const usuarioRotas = require('../rotas/usuario.rotas');
const assinaturaRotas = require('../rotas/assinatura.rotas');
const webhookRotas = require('../rotas/webhook.rotas');

jest.mock('stripe');

const app = express();
// A ordem é importante: o webhook precisa do 'raw body' antes do json()
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
  const stripeInstance = new stripe();

  beforeEach(async () => {
    jest.clearAllMocks();
    await conexao.sync({ force: true });
    
    const dadosUsuario = { nome: 'Utilizador Assinatura', email: `sub-${Date.now()}@teste.com`, senha: '12345678' };
    const registroRes = await request(app).post('/api/usuarios/registrar').send(dadosUsuario);
    usuario = registroRes.body.usuario;

    const loginResponse = await request(app).post('/api/usuarios/login').send({ email: dadosUsuario.email, senha: '12345678' });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve criar uma sessão de checkout do Stripe', async () => {
    const sessaoFalsa = { url: 'https://checkout.stripe.com/pay/cs_test_12345' };
    stripeInstance.checkout.sessions.create.mockResolvedValue(sessaoFalsa);

    const response = await request(app)
      .post('/api/assinatura/criar-sessao-checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ planoId: 'price_xxxxxxxx' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(sessaoFalsa.url);
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  // --- TESTE CORRIGIDO ---
  it('Deve atualizar o plano do utilizador quando o webhook de checkout.session.completed for recebido', async () => {
    const customerId = 'cus_12345';
    const subscriptionId = 'sub_12345';
    const { Usuario } = conexao.models;

    // AQUI ESTÁ A CORREÇÃO: Atualizamos o utilizador na base de dados ANTES de simular o webhook.
    // Desta forma, o webhook saberá qual utilizador associar ao customerId.
    await Usuario.update({ stripe_customer_id: customerId }, { where: { id: usuario.id } });

    const eventoFalso = {
      id: 'evt_123', object: 'event', type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          customer: customerId,
          subscription: subscriptionId
        }
      }
    };
    
    const subscricaoFalsa = {
      id: subscriptionId,
      status: 'active', // Estado da assinatura
      items: { data: [{ price: { id: process.env.STRIPE_PRICE_ID_PREMIUM_MENSAL } }] }
    };

    stripeInstance.webhooks.constructEvent.mockReturnValue(eventoFalso);
    stripeInstance.subscriptions.retrieve.mockResolvedValue(subscricaoFalsa);

    await request(app)
      .post('/webhook')
      .set('stripe-signature', 'assinatura_falsa')
      .send(Buffer.from(JSON.stringify(eventoFalso)));

    const utilizadorAtualizado = await Usuario.findByPk(usuario.id);

    expect(utilizadorAtualizado.plano).toBe('premium');
    expect(utilizadorAtualizado.status_assinatura).toBe('ativa');
    expect(utilizadorAtualizado.stripe_customer_id).toBe(customerId);
    expect(utilizadorAtualizado.stripe_subscription_id).toBe(subscriptionId);
  });
  
  // Os outros testes permanecem iguais...
  it('Deve permitir que um utilizador com assinatura ativa troque de plano', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao', status_assinatura: 'ativa' }, { where: { id: usuario.id } });
    const response = await request(app)
        .put('/api/assinatura/trocar-plano')
        .set('Authorization', `Bearer ${token}`)
        .send({ novoPlano: 'premium' });
    expect(response.status).toBe(200);
    const utilizadorAtualizado = await Usuario.findByPk(usuario.id);
    expect(utilizadorAtualizado.plano).toBe('premium');
  });

  it('Deve criar uma sessão do Portal de Faturação para um cliente existente do Stripe', async () => {
    const { Usuario } = conexao.models;
    await Usuario.update({ 
        plano: 'premium', 
        status_assinatura: 'ativa',
        stripe_customer_id: 'cus_12345'
    }, { where: { id: usuario.id } });

    const portalFalso = { url: 'https://billing.stripe.com/p/session/123' };
    stripeInstance.billingPortal.sessions.create.mockResolvedValue(portalFalso);

    const response = await request(app)
        .post('/api/assinatura/criar-sessao-portal')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(portalFalso.url);
  });

  it('Deve criar uma sessão de Checkout para um utilizador em teste que quer gerir a faturação', async () => {
    const { Usuario } = conexao.models;
    const dataTermino = new Date();
    dataTermino.setDate(dataTermino.getDate() + 5);
    await Usuario.update({ 
        plano: 'premium', 
        status_assinatura: 'teste',
        teste_termina_em: dataTermino
    }, { where: { id: usuario.id } });

    const sessaoCheckoutFalsa = { url: 'https://checkout.stripe.com/pay/cs_test_abcde' };
    stripeInstance.checkout.sessions.create.mockResolvedValue(sessaoCheckoutFalsa);
    
    const response = await request(app)
        .post('/api/assinatura/criar-sessao-portal')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(sessaoCheckoutFalsa.url);
  });
});