// Dentro do arquivo criado na pasta /migrations

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // A função 'up' é executada quando aplicamos a migration (db:migrate).
  // Ela deve conter a lógica para CRIAR a estrutura.
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("usuarios", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // Garante que não teremos e-mails repetidos.
      },
      senha: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      // Campos de data que o Sequelize gerencia para nós.
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

  // A função 'down' é executada quando revertemos a migration (db:migrate:undo).
  // Ela deve conter a lógica para DESFAZER o que a função 'up' fez.
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("usuarios");
  },
};
