'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Altera a coluna 'notas_adicionais' da tabela 'musicas' para o tipo TEXT
    await queryInterface.changeColumn('musicas', 'notas_adicionais', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Opcional: reverte a alteração se precisar de desfazer a migração
    await queryInterface.changeColumn('musicas', 'notas_adicionais', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};