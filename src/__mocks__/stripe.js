// src/__mocks__/stripe.js

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
  // --- ADICIONE ESTE BLOCO ---
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
};

const mockStripe = jest.fn(() => mockStripeInstance);

module.exports = mockStripe;