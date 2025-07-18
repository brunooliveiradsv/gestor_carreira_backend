'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'biografia', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'url_unica', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'biografia');
    await queryInterface.removeColumn('usuarios', 'url_unica');
  }
};