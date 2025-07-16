'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sugestao_musicas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      musica_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'musicas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Se a música for apagada, as sugestões para ela também são.
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Se o usuário for apagado, a sugestão permanece (anónima).
      },
      campo_sugerido: {
        type: Sequelize.STRING,
        allowNull: false, // Ex: 'tom', 'bpm', 'notas_adicionais'
      },
      valor_sugerido: {
        type: Sequelize.TEXT, // Usamos TEXT para acomodar cifras longas
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aprovada', 'rejeitada'),
        defaultValue: 'pendente',
        allowNull: false,
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
    await queryInterface.dropTable('sugestao_musicas');
  }
};