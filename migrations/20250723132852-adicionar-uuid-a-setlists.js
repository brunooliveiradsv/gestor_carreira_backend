'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('setlists', 'publico_uuid', {
      type: Sequelize.UUID,
      allowNull: true, // Começa nulo, só é gerado quando o utilizador partilha
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('setlists', 'publico_uuid');
  }
};