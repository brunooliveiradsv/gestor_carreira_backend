'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('compromissos', 'repertorio_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Um compromisso pode não ter um repertório associado
      references: { model: 'repertorios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Se o repertório for apagado, o compromisso não some, apenas perde o vínculo.
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('compromissos', 'repertorio_id');
  }
};