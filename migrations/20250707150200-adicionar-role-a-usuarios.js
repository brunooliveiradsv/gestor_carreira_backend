'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'role', {
      type: Sequelize.ENUM('usuario', 'admin'),
      allowNull: false,
      defaultValue: 'usuario' // Todo novo usuário será 'usuario' por padrão
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'role');
    // O ENUM cria um tipo customizado, precisamos apagar esse tipo também.
    await queryInterface.sequelize.query('DROP TYPE "enum_usuarios_role";');
  }
};