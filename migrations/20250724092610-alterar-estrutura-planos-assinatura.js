'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Adiciona o novo valor ao ENUM fora de qualquer transação.
    // Usamos a cláusula 'IF NOT EXISTS' para segurança, caso a migration seja executada parcialmente.
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_usuarios_plano" ADD VALUE IF NOT EXISTS 'free'`
    );

    // 2. Inicia uma transação para as operações de dados, que são seguras.
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove os valores padrão antigos
      await queryInterface.sequelize.query('ALTER TABLE "usuarios" ALTER COLUMN "plano" DROP DEFAULT;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE "usuarios" ALTER COLUMN "status_assinatura" DROP DEFAULT;', { transaction });

      // Define os novos padrões
      await queryInterface.sequelize.query("ALTER TABLE \"usuarios\" ALTER COLUMN \"plano\" SET DEFAULT 'free'", { transaction });
      await queryInterface.sequelize.query("ALTER TABLE \"usuarios\" ALTER COLUMN \"status_assinatura\" SET DEFAULT 'ativa'", { transaction });

      // Atualiza os utilizadores existentes
      await queryInterface.sequelize.query(
        `UPDATE "usuarios" SET "plano" = 'free', "status_assinatura" = 'ativa' WHERE "plano" IS NULL OR "status_assinatura" = 'inativa'`,
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // A reversão de uma adição de ENUM é complexa.
    console.log("A reversão desta migration não é suportada automaticamente.");
  }
};