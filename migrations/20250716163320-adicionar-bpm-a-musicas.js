'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona a nova coluna 'bpm' à tabela 'musicas'
    await queryInterface.addColumn('musicas', 'bpm', {
      type: Sequelize.INTEGER,
      allowNull: true, // Permite que seja nulo, pois nem toda música terá BPM
    });
  },

  async down(queryInterface, Sequelize) {
    // Lógica para reverter: remove a coluna 'bpm'
    await queryInterface.removeColumn('musicas', 'bpm');
  }
};