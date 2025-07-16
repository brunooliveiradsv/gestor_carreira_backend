// migrations/20250714211150-criar-tabela-tags.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // A função 'up' já está correta
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
    // --- CORREÇÃO APLICADA AQUI ---
    // Antes de apagar a tabela 'tags', apagamos a tabela 'musica_tags' que depende dela.
    // Isto resolve a restrição de chave estrangeira (foreign key).
    await queryInterface.dropTable('musica_tags');
    await queryInterface.dropTable('tags');
  }
};