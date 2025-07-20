// migrations/xxxxxxxx-adicionar-campos-assinatura-a-usuarios.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Adiciona a coluna para o tipo de plano do usuário
    await queryInterface.addColumn('usuarios', 'plano', {
      // CORREÇÃO: Alterado para refletir os dois planos pagos
      type: Sequelize.ENUM('padrao', 'premium'), 
      allowNull: true, // Será nulo até o usuário iniciar um teste/assinatura
    });

    // Adiciona a coluna para o status atual da assinatura
    await queryInterface.addColumn('usuarios', 'status_assinatura', {
      type: Sequelize.ENUM('inativa', 'ativa', 'teste', 'cancelada', 'inadimplente'),
      allowNull: false,
      defaultValue: 'inativa',
    });

    // Adiciona a coluna para guardar a data de expiração do teste
    await queryInterface.addColumn('usuarios', 'teste_termina_em', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'plano');
    await queryInterface.removeColumn('usuarios', 'status_assinatura');
    await queryInterface.removeColumn('usuarios', 'teste_termina_em');
    await queryInterface.sequelize.query('DROP TYPE "enum_usuarios_plano";');
    await queryInterface.sequelize.query('DROP TYPE "enum_usuarios_status_assinatura";');
  }
};