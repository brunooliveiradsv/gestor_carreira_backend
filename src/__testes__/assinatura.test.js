// src/__testes__/assinatura.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const stripe = require('stripe'); // O Jest vai substituir isto pela nossa simulação
const conexao = require('../database');
const tratadorDeErros = require('../middlewares/tratadorDeErros');

const usuarioRotas = require('../rotas/usuario.rotas');
const assinaturaRotas = require('../rotas/assinatura.rotas');
const webhookRotas = require('../rotas/webhook.rotas');

// Diz ao Jest para usar a nossa simulação manual em src/__mocks__/stripe.js
jest.mock('stripe');

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
  // O construtor do Stripe é agora um mock. Vamos obter a instância que ele retorna.
  const stripeInstance = new stripe();

  beforeEach(async () => {
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
    stripeInstance.checkout.sessions.create.mockResolvedValue(sessaoFalsa);

    const response = await request(app)
      .post('/api/assinatura/criar-sessao-checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({ planoId: 'price_xxxxxxxx' });

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(sessaoFalsa.url);
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);
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

    stripeInstance.webhooks.constructEvent.mockReturnValue(eventoFalso);
    stripeInstance.subscriptions.retrieve.mockResolvedValue(subscricaoFalsa);

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

  it('Deve permitir que um utilizador com assinatura ativa troque de plano', async () => {
    // 1. Garante que o utilizador tem uma assinatura ativa
    const { Usuario } = conexao.models;
    await Usuario.update({ plano: 'padrao', status_assinatura: 'ativa' }, { where: { id: usuario.id } });

    // 2. Chama a rota para trocar para o plano premium
    const response = await request(app)
        .put('/api/assinatura/trocar-plano')
        .set('Authorization', `Bearer ${token}`)
        .send({ novoPlano: 'premium' });

    expect(response.status).toBe(200);
    expect(response.body.mensagem).toContain('plano foi alterado para premium');

    // 3. Verifica a alteração na base de dados
    const utilizadorAtualizado = await Usuario.findByPk(usuario.id);
    expect(utilizadorAtualizado.plano).toBe('premium');
  });

  it('Deve criar uma sessão do Portal de Faturação para um cliente existente do Stripe', async () => {
    // 1. Simula um utilizador que já é um cliente pagador no Stripe
    const { Usuario } = conexao.models;
    await Usuario.update({ 
        plano: 'premium', 
        status_assinatura: 'ativa',
        stripe_customer_id: 'cus_12345' // ID de cliente do Stripe
    }, { where: { id: usuario.id } });

    // 2. Configura o mock do Stripe para o portal
    const portalFalso = { url: 'https://billing.stripe.com/p/session/123' };
    const stripeInstance = new stripe();
    stripeInstance.billingPortal.sessions.create.mockResolvedValue(portalFalso);

    // 3. Chama a rota do portal
    const response = await request(app)
        .post('/api/assinatura/criar-sessao-portal')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(portalFalso.url);
    expect(stripeInstance.billingPortal.sessions.create).toHaveBeenCalledTimes(1);
  });

  it('Deve criar uma sessão de Checkout para um utilizador em teste que quer gerir a faturação', async () => {
    // 1. Simula um utilizador em período de teste
    const { Usuario } = conexao.models;
    const dataTermino = new Date();
    dataTermino.setDate(dataTermino.getDate() + 5); // Teste termina em 5 dias
    await Usuario.update({ 
        plano: 'premium', 
        status_assinatura: 'teste',
        teste_termina_em: dataTermino
    }, { where: { id: usuario.id } });

    // 2. Configura o mock do Stripe para uma sessão de checkout
    const sessaoCheckoutFalsa = { url: 'https://checkout.stripe.com/pay/cs_test_abcde' };
    const stripeInstance = new stripe();
    stripeInstance.checkout.sessions.create.mockResolvedValue(sessaoCheckoutFalsa);
    
    // 3. Chama a rota do portal, que deve redirecionar para o checkout
    const response = await request(app)
        .post('/api/assinatura/criar-sessao-portal')
        .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.url).toBe(sessaoCheckoutFalsa.url);
    expect(stripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

});