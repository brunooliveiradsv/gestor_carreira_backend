'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Remove o valor padrão antigo da coluna 'plano'
      await queryInterface.sequelize.query(
        'ALTER TABLE "usuarios" ALTER COLUMN "plano" DROP DEFAULT;',
        { transaction }
      );

      // 2. Remove o valor padrão antigo da coluna 'status_assinatura'
      await queryInterface.sequelize.query(
        'ALTER TABLE "usuarios" ALTER COLUMN "status_assinatura" DROP DEFAULT;',
        { transaction }
      );

      // 3. Adiciona 'free' ao ENUM 'enum_usuarios_plano'
      // O PostgreSQL não permite adicionar a um ENUM dentro de uma transação em todas as versões, mas tentamos.
      // Se falhar, pode ser necessário executar este comando fora da transação.
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_usuarios_plano" ADD VALUE 'free';`,
        { transaction }
      );
      
      // 4. Altera a coluna 'plano' para usar o tipo atualizado e define o novo padrão
      await queryInterface.changeColumn('usuarios', 'plano', {
        type: Sequelize.ENUM('padrao', 'premium', 'free'), // Inclui o novo valor
        allowNull: true,
        defaultValue: 'free', // Define 'free' como padrão para novas linhas
      }, { transaction });

      // 5. Altera a coluna 'status_assinatura' para definir o novo padrão
      await queryInterface.changeColumn('usuarios', 'status_assinatura', {
        type: Sequelize.ENUM('inativa', 'ativa', 'teste', 'cancelada', 'inadimplente'),
        allowNull: false,
        defaultValue: 'ativa', // Novos utilizadores 'free' já começam como 'ativos'
      }, { transaction });

      // 6. Atualiza todos os utilizadores existentes que não têm plano para o plano 'free'
      await queryInterface.sequelize.query(
        `UPDATE "usuarios" SET "plano" = 'free' WHERE "plano" IS NULL;`,
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverter estas alterações é complexo e pode causar perda de dados.
    // O ideal é avançar com a nova estrutura.
    console.log("A reversão desta migration não é suportada automaticamente para evitar perda de dados.");
  }
};