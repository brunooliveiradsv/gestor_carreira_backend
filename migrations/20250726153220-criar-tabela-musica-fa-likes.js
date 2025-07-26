// ficheiro: migrations/xxxxxxxx-criar-tabela-musica-fa-likes.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('musica_fa_likes', {
      fa_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'fas', key: 'id' },
        onDelete: 'CASCADE'
      },
      musica_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'musicas', key: 'id' },
        onDelete: 'CASCADE'
      },
      created_at: { allowNull: false, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('musica_fa_likes');
  }
};