'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('musicas', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      usuario_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      nome: { type: Sequelize.STRING, allowNull: false },
      artista: { type: Sequelize.STRING, allowNull: false },
      tom: { type: Sequelize.STRING, allowNull: true },
      // O nome da coluna e o tipo estão corretos aqui
      duracao_minutos: { 
        type: Sequelize.STRING, 
        allowNull: true 
      },
      bpm: { type: Sequelize.INTEGER, allowNull: true },
      link_cifra: { type: Sequelize.STRING, allowNull: true },
      link_letra: { type: Sequelize.STRING, allowNull: true },
      link_video: { type: Sequelize.STRING, allowNull: true },
      notas_adicionais: { type: Sequelize.TEXT, allowNull: true },
      popularidade: { type: Sequelize.INTEGER, defaultValue: 0, allowNull: false },
      ultima_vez_tocada: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('musicas');
  }
};