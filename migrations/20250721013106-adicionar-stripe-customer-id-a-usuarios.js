'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'stripe_customer_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'stripe_customer_id');
  }
};