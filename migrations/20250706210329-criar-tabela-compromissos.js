'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compromissos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      // Coluna para saber a qual usuário este compromisso pertence.
      // Esta é a chave da nossa segurança de dados.
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' }, // Cria a referência à tabela 'usuarios'
        onUpdate: 'CASCADE', // Se o ID do usuário mudar, atualiza aqui também.
        onDelete: 'CASCADE', // Se o usuário for deletado, todos os seus compromissos também serão.
      },
      tipo: {
        type: Sequelize.STRING, // Ex: "Show", "Ensaio", "Gravação"
        allowNull: false,
      },
      nome_evento: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      data: {
        type: Sequelize.DATE, // Armazena data e hora
        allowNull: false,
      },
      local: {
        type: Sequelize.STRING,
        allowNull: true, // O local pode não ser aplicável (ex: uma tarefa)
      },
      status: {
        type: Sequelize.STRING, // Ex: "Agendado", "Realizado", "Cancelado"
        defaultValue: 'Agendado', // Um valor padrão
        allowNull: false,
      },
      valor_cache: {
        type: Sequelize.DECIMAL(10, 2), // Para valores monetários
        allowNull: true,
      },
      // created_at e updated_at serão criados automaticamente pelo Sequelize
      // porque configuramos 'timestamps: true' no nosso config.
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
    await queryInterface.dropTable('compromissos');
  }
};