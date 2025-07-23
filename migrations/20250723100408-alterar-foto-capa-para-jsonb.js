'use strict';
module.exports = {
  async up (queryInterface, Sequelize) {
    // Usamos queryInterface.sequelize.transaction para garantir que a operação é segura
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Adicionamos a cláusula USING para dizer ao PostgreSQL como converter os dados
      await queryInterface.sequelize.query(`
        ALTER TABLE "usuarios" 
        ALTER COLUMN "foto_capa_url" TYPE JSONB 
        USING CAST(CONCAT('["', "foto_capa_url", '"]') AS JSONB);
      `, { transaction });
      
      // Depois da conversão, definimos o valor padrão para novos utilizadores
      await queryInterface.sequelize.query(`
        ALTER TABLE "usuarios" 
        ALTER COLUMN "foto_capa_url" SET DEFAULT '[]'::jsonb;
      `, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    // Comando para reverter, extraindo o primeiro elemento do array
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        ALTER TABLE "usuarios"
        ALTER COLUMN "foto_capa_url" TYPE VARCHAR(255)
        USING (foto_capa_url->>0);
      `, { transaction });

      await queryInterface.sequelize.query(`
        ALTER TABLE "usuarios" 
        ALTER COLUMN "foto_capa_url" DROP DEFAULT;
      `, { transaction });
      
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};