'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Altera a coluna para o tipo STRING
    await queryInterface.changeColumn('musicas', 'duracao_segundos', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverte para INTEGER se for preciso (exige conversão manual dos dados)
    await queryInterface.changeColumn('musicas', 'duracao_segundos', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};