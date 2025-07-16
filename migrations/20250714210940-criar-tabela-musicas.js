// migrations/20250714210940-criar-tabela-musicas.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('musicas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING, allowNull: false },
      artista: { type: Sequelize.STRING, allowNull: false },
      tom: { type: Sequelize.STRING, allowNull: true },
      // CORREÇÃO: Alterado para STRING desde a criação
      duracao_segundos: {
        type: Sequelize.STRING, 
        allowNull: true,
      },
      link_cifra: { type: Sequelize.STRING, allowNull: true },
      link_letra: { type: Sequelize.STRING, allowNull: true },
      link_video: { type: Sequelize.STRING, allowNull: true },
      notas_adicionais: { type: Sequelize.TEXT, allowNull: true },
      popularidade: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      ultima_vez_tocada: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      // CORREÇÃO: Adicionado o campo bpm que estava em outra migração, para consistência
      bpm: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('musicas');
  }
};