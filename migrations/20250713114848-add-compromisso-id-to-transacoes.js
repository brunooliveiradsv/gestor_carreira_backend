// database/migrations/SEU_TIMESTAMP-add-compromisso-id-to-transacoes.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('transacoes', 'compromisso_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Pode ser nulo, pois nem toda transação vem de um compromisso
      references: {
        model: 'compromissos', // Nome da tabela de compromissos
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // Se o compromisso for apagado, o ID na transação vira NULL
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('transacoes', 'compromisso_id');
  }
};