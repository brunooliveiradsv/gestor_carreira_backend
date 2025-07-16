// migrations/20250714211150-criar-tabela-tags.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // CORREÇÃO: Garante que a tabela dependente seja removida antes.
    await queryInterface.dropTable('musica_tags').catch(() => {}); // O .catch ignora erros se a tabela já foi apagada.
    await queryInterface.dropTable('tags');
  }
};