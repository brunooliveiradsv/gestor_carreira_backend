'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Comando para ADICIONAR a nova coluna à tabela existente 'Usuarios'
    await queryInterface.addColumn('usuarios', 'stripe_subscription_id', {
      type: Sequelize.STRING,
      allowNull: true, // Permite que seja nulo, pois nem todos os utilizadores terão uma assinatura
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Comando para REMOVER a coluna, caso precise de reverter a migração
    await queryInterface.removeColumn('usuarios', 'stripe_subscription_id');
  }
};