'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Torna a coluna usuario_id opcional (músicas mestre não têm dono)
      await queryInterface.changeColumn('musicas', 'usuario_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      }, { transaction });

      // Adiciona a coluna para saber se a música é pública (visível para todos)
      await queryInterface.addColumn('musicas', 'is_publica', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      }, { transaction });

      // Adiciona a coluna para linkar uma música de usuário a uma música mestre
      await queryInterface.addColumn('musicas', 'master_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'musicas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL', // Se a mestre for apagada, a do usuário vira uma cópia órfã
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('musicas', 'master_id', { transaction });
      await queryInterface.removeColumn('musicas', 'is_publica', { transaction });
      await queryInterface.changeColumn('musicas', 'usuario_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
      }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};