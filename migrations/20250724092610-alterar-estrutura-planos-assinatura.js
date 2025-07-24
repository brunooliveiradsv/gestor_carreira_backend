'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove os valores padrão antigos para evitar conflitos
      await queryInterface.sequelize.query('ALTER TABLE "usuarios" ALTER COLUMN "plano" DROP DEFAULT;', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE "usuarios" ALTER COLUMN "status_assinatura" DROP DEFAULT;', { transaction });

      // Adiciona 'free' ao tipo ENUM existente para a coluna 'plano'
      await queryInterface.sequelize.query("ALTER TYPE \"enum_usuarios_plano\" ADD VALUE 'free'", { transaction });
      
      // Define 'free' como o novo padrão para a coluna 'plano'
      await queryInterface.sequelize.query("ALTER TABLE \"usuarios\" ALTER COLUMN \"plano\" SET DEFAULT 'free'", { transaction });
      
      // Define 'ativa' como o novo padrão para 'status_assinatura'
      await queryInterface.sequelize.query("ALTER TABLE \"usuarios\" ALTER COLUMN \"status_assinatura\" SET DEFAULT 'ativa'", { transaction });

      // Atualiza utilizadores existentes que não têm plano (NULL) para o plano 'free'
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
    // A reversão de uma adição de ENUM é complexa e pode não ser necessária.
    // Focamo-nos no caminho 'up'.
    console.log("A reversão desta migration para remover um valor de ENUM não é suportada automaticamente.");
  }
};