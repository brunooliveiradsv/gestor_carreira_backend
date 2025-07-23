// migrations/xxxxxxxx-alterar-foto-capa-para-jsonb.js
'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('usuarios', 'foto_capa_url', {
      type: Sequelize.JSONB, // Altera o tipo da coluna
      allowNull: true,
      defaultValue: [], // Define um array vazio como padrão
    });
  },

  async down (queryInterface, Sequelize) {
    // Comando para reverter a alteração, se necessário
    await queryInterface.changeColumn('usuarios', 'foto_capa_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};