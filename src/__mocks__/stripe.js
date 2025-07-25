// src/__mocks__/stripe.js

// 1. Criamos um objeto partilhado que será a nossa "instância" falsa do Stripe.
//    Exportamo-lo para que o nosso ficheiro de teste o possa importar e controlar.
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

// 2. O módulo 'stripe' é uma função construtora.
//    Exportamos uma função de simulação que SEMPRE retorna a nossa instância partilhada.
module.exports = jest.fn(() => mockStripeInstance);