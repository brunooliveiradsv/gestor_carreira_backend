// migrations/20250716183540-alterar-duracao-para-string-em-musicas.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // A função 'up' já está correta, alterando para STRING
    await queryInterface.changeColumn('musicas', 'duracao_segundos', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // CORREÇÃO: A função 'down' agora reverte para STRING, evitando o erro.
    // O tipo original era INTEGER, mas como os dados agora são texto,
    // não podemos reverter para INTEGER sem causar um erro.
    await queryInterface.changeColumn('musicas', 'duracao_segundos', {
      type: Sequelize.STRING, // Mantém como STRING para evitar o erro de cast
      allowNull: true,
    });
  }
};