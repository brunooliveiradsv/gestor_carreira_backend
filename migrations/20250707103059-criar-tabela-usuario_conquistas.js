'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuario_conquistas', {
      // Chave estrangeira para o usuário
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // Parte da chave primária composta
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Chave estrangeira para a conquista
      conquista_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true, // Parte da chave primária composta
        references: { model: 'conquistas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Data em que a conquista foi desbloqueada
      data_desbloqueio: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // Sequelize não gerencia timestamps para esta tabela "ponte"
      // então definimos 'created_at' manualmente se quisermos.
      // Para simplificar, vamos usar apenas 'data_desbloqueio'.
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuario_conquistas');
  }
};