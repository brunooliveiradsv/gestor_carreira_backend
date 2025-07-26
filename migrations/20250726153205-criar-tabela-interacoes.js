// ficheiro: migrations/xxxxxxxx-criar-tabela-interacoes.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interacoes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      fa_id: { // Quem fez a ação
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'fas', key: 'id' },
        onDelete: 'CASCADE'
      },
      artista_id: { // O artista que recebeu a interação
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE'
      },
      tipo: { // O tipo de ação
        type: Sequelize.ENUM('APLAUSO', 'LIKE_MUSICA', 'VOTO_ENQUETE'),
        allowNull: false
      },
      entidade_id: { // O ID do item que sofreu a interação (ex: ID da música, ID da opção da enquete)
        type: Sequelize.STRING,
        allowNull: true
      },
      pontos: { // Pontos atribuídos a esta ação
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('interacoes');
  }
};