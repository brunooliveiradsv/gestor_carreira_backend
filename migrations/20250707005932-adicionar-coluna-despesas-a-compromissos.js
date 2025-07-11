'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona a nova coluna 'despesas' à tabela 'compromissos'
    await queryInterface.addColumn('compromissos', 'despesas', {
      type: Sequelize.JSONB, // Um tipo de dado especial para guardar JSON (listas, objetos)
      allowNull: true,      // Permite que o campo seja nulo (nem todo compromisso tem despesa)
    });
  },

  async down(queryInterface, Sequelize) {
    // Lógica para reverter: remove a coluna 'despesas'
    await queryInterface.removeColumn('compromissos', 'despesas');
  }
};