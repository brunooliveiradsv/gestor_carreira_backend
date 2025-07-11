"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "conquistas",
      [
        // Agenda e Palco
        {
          nome: "Primeiros Passos",
          descricao: "Cadastrou seu primeiro compromisso.",
          tipo_condicao: "PRIMEIRO_COMPROMISSO_CRIADO",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "No Palco",
          descricao: "Realizou o primeiro show.",
          tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Dezena de Shows",
          descricao: "Realizou 10 shows.",
          tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
          valor_condicao: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Vinte é Sucesso",
          descricao: "Realizou 20 shows.",
          tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
          valor_condicao: 20,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Rei da Estrada",
          descricao: "Realizou 50 shows.",
          tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
          valor_condicao: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Trabalho Duro",
          descricao: "Realizou 10 ensaios.",
          tipo_condicao: "CONTAGEM_ENSAIOS_REALIZADOS",
          valor_condicao: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Prodígio de Estúdio",
          descricao: "Realizou 5 gravações.",
          tipo_condicao: "CONTAGEM_GRAVACOES_REALIZADAS",
          valor_condicao: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Financeiras
        {
          nome: "Primeiro Cachê",
          descricao: "Lançou a primeira receita vinda de um show.",
          tipo_condicao: "PRIMEIRA_RECEITA_SHOW",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Pé de Meia",
          descricao: "Atingiu R$ 1.000 em receitas totais.",
          tipo_condicao: "TOTAL_RECEITAS",
          valor_condicao: 1000,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Profissional",
          descricao: "Atingiu R$ 5.000 em receitas totais.",
          tipo_condicao: "TOTAL_RECEITAS",
          valor_condicao: 5000,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Empresário de Si",
          descricao: "Atingiu R$ 10.000 em receitas totais.",
          tipo_condicao: "TOTAL_RECEITAS",
          valor_condicao: 10000,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Investidor Anjo",
          descricao: 'Cadastrou a primeira despesa na categoria "Equipamento".',
          icone: "fas fa-piggy-bank",
          tipo_condicao: "PRIMEIRA_DESPESA_EQUIPAMENTO",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Networking
        {
          nome: "Quebrando o Gelo",
          descricao: "Adicionou seu primeiro contato.",
          tipo_condicao: "CONTAGEM_CONTATOS",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Bem Relacionado",
          descricao: "Adicionou 10 contatos.",
          tipo_condicao: "CONTAGEM_CONTATOS",
          valor_condicao: 10,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Conectado",
          descricao: "Adicionou 25 contatos.",
          tipo_condicao: "CONTAGEM_CONTATOS",
          valor_condicao: 25,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "O Influente",
          descricao: "Adicionou 50 contatos.",
          tipo_condicao: "CONTAGEM_CONTATOS",
          valor_condicao: 50,
          created_at: new Date(),
          updated_at: new Date(),
        },

        // Repertório
        {
          nome: "O Poeta",
          descricao: "Criou seu primeiro repertório.",
          tipo_condicao: "PRIMEIRO_REPERTORIO_CRIADO",
          valor_condicao: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          nome: "Versátil",
          descricao: "Criou 5 repertórios diferentes.",
          tipo_condicao: "CONTAGEM_REPERTORIOS",
          valor_condicao: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("conquistas", null, {});
  },
};