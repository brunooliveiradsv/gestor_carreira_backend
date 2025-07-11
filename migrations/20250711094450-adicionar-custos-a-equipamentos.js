'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona a coluna para o valor da compra
    await queryInterface.addColumn('equipamentos', 'valor_compra', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // Permite nulo, pois um equipamento pode já ser antigo
    });
    // Adiciona a coluna para a data da compra
    await queryInterface.addColumn('equipamentos', 'data_compra', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('equipamentos', 'valor_compra');
    await queryInterface.removeColumn('equipamentos', 'data_compra');
  }
};