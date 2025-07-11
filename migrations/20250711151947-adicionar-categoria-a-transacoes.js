'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transacoes', 'categoria', {
      type: Sequelize.STRING,
      allowNull: true // Permite que seja nulo para transações que não têm categoria
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transacoes', 'categoria');
  }
};