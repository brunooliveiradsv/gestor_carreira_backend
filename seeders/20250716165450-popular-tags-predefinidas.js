// seeders/20250716200000-popular-tags-predefinidas.js
'use strict';

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const nomesDasTags = [
      'Acústico', 'Anos 80', 'Anos 90', 'Anos 2000', 'Ao Vivo',
      'Balada', 'Blues', 'Country', 'Dança', 'Festa', 'Gospel',
      'Instrumental', 'Internacional', 'Jantar', 'Jazz', 'Lenta',
      'MPB', 'Nacional', 'Pop', 'Rápida', 'Reggae', 'Rock', 'Samba', 'Sertanejo'
    ];
    
    // Transforma o array de nomes num formato que o bulkInsert entende
    const tagsParaInserir = nomesDasTags.map(nome => ({
      nome,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert('tags', tagsParaInserir, {
      // Ignora duplicados: se a tag já existir, não tenta inserir novamente
      ignoreDuplicates: true 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('tags', null, {});
  }
};