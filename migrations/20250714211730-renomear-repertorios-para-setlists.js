'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Renomeia a tabela principal
    await queryInterface.renameTable('repertorios', 'setlists');
    
    // Também precisamos renomear a coluna em 'compromissos' que se refere a ela
    await queryInterface.renameColumn('compromissos', 'repertorio_id', 'setlist_id');
  },

  async down(queryInterface, Sequelize) {
    // A ordem inversa é importante ao reverter
    await queryInterface.renameColumn('compromissos', 'setlist_id', 'repertorio_id');
    await queryInterface.renameTable('setlists', 'repertorios');
  }
};