'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conquistas', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      descricao: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Um campo para, no futuro, associarmos um ícone a cada conquista
      icone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // A "regra" para desbloquear a conquista
      tipo_condicao: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // O "valor" da regra (ex: 10 para 10 shows)
      valor_condicao: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      // Sequelize gerencia 'createdAt' e 'updatedAt'
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conquistas');
  }
};