'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transacoes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Chave estrangeira para saber a qual usuário a transação pertence
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Chave estrangeeira para associar a transação a um compromisso (opcional)
      compromisso_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Uma transação pode não estar ligada a um evento (ex: compra de equipamento)
        references: { model: 'compromissos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Se o compromisso for apagado, a transação não some, apenas perde o vínculo.
      },
      descricao: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      // Define se é uma Receita ou uma Despesa
      tipo: {
        type: Sequelize.ENUM('receita', 'despesa'),
        allowNull: false,
      },
      data: {
        type: Sequelize.DATE,
        allowNull: false,
      },
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
    await queryInterface.dropTable('transacoes');
  }
};