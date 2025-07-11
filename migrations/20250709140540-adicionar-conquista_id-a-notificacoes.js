'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notificacoes', 'conquista_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'conquistas', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notificacoes', 'conquista_id');
  }
};