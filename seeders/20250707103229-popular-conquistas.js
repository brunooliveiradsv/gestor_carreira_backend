// seeders/20250707103229-popular-conquistas.js
"use strict";

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lista de todas as conquistas que devem existir
    const conquistasParaAdicionar = [
      // Agenda e Palco
      {
        nome: "Primeiros Passos",
        descricao: "Cadastrou seu primeiro compromisso.",
        tipo_condicao: "PRIMEIRO_COMPROMISSO_CRIADO",
        valor_condicao: 1,
      },
      {
        nome: "No Palco",
        descricao: "Realizou o primeiro show.",
        tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
        valor_condicao: 1,
      },
      {
        nome: "Dezena de Shows",
        descricao: "Realizou 10 shows.",
        tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
        valor_condicao: 10,
      },
      {
        nome: "Vinte é Sucesso",
        descricao: "Realizou 20 shows.",
        tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
        valor_condicao: 20,
      },
      {
        nome: "Rei da Estrada",
        descricao: "Realizou 50 shows.",
        tipo_condicao: "CONTAGEM_SHOWS_REALIZADOS",
        valor_condicao: 50,
      },
      {
        nome: "Trabalho Duro",
        descricao: "Realizou 10 ensaios.",
        tipo_condicao: "CONTAGEM_ENSAIOS_REALIZADOS",
        valor_condicao: 10,
      },
      {
        nome: "Prodígio de Estúdio",
        descricao: "Realizou 5 gravações.",
        tipo_condicao: "CONTAGEM_GRAVACOES_REALIZADAS",
        valor_condicao: 5,
      },

      // Financeiras
      {
        nome: "Primeiro Cachê",
        descricao: "Lançou a primeira receita vinda de um show.",
        tipo_condicao: "PRIMEIRA_RECEITA_SHOW",
        valor_condicao: 1,
      },
      {
        nome: "Pé de Meia",
        descricao: "Atingiu R$ 1.000 em receitas totais.",
        tipo_condicao: "TOTAL_RECEITAS",
        valor_condicao: 1000,
      },
      {
        nome: "Profissional",
        descricao: "Atingiu R$ 5.000 em receitas totais.",
        tipo_condicao: "TOTAL_RECEITAS",
        valor_condicao: 5000,
      },
      {
        nome: "Empresário de Si",
        descricao: "Atingiu R$ 10.000 em receitas totais.",
        tipo_condicao: "TOTAL_RECEITAS",
        valor_condicao: 10000,
      },
      {
        nome: "Investidor Anjo",
        descricao: 'Cadastrou a primeira despesa na categoria "Equipamento".',
        icone: "fas fa-piggy-bank",
        tipo_condicao: "PRIMEIRA_DESPESA_EQUIPAMENTO",
        valor_condicao: 1,
      },

      // Networking
      {
        nome: "Quebrando o Gelo",
        descricao: "Adicionou seu primeiro contato.",
        tipo_condicao: "CONTAGEM_CONTATOS",
        valor_condicao: 1,
      },
      {
        nome: "Bem Relacionado",
        descricao: "Adicionou 10 contatos.",
        tipo_condicao: "CONTAGEM_CONTATOS",
        valor_condicao: 10,
      },
      {
        nome: "Conectado",
        descricao: "Adicionou 25 contatos.",
        tipo_condicao: "CONTAGEM_CONTATOS",
        valor_condicao: 25,
      },
      {
        nome: "O Influente",
        descricao: "Adicionou 50 contatos.",
        tipo_condicao: "CONTAGEM_CONTATOS",
        valor_condicao: 50,
      },

      // Repertório
      {
        nome: "O Poeta",
        descricao: "Criou seu primeiro setlist.",
        tipo_condicao: "PRIMEIRO_REPERTORIO_CRIADO",
        valor_condicao: 1,
      },
      {
        nome: "Versátil",
        descricao: "Criou 5 setlists diferentes.",
        tipo_condicao: "CONTAGEM_REPERTORIOS",
        valor_condicao: 5,
      },
    ].map((c) => ({ ...c, created_at: new Date(), updated_at: new Date() })); // Adiciona timestamps

    // 1. Busca os nomes de todas as conquistas que já estão no banco de dados
    const conquistasExistentes = await queryInterface.sequelize.query(
      `SELECT nome FROM conquistas;`
    );

    const nomesExistentes = conquistasExistentes[0].map((c) => c.nome);

    // 2. Filtra a lista, mantendo apenas as conquistas que AINDA NÃO existem
    const conquistasNovas = conquistasParaAdicionar.filter(
      (c) => !nomesExistentes.includes(c.nome)
    );

    // 3. Insere apenas as novas conquistas, se houver alguma
    if (conquistasNovas.length > 0) {
      await queryInterface.bulkInsert("conquistas", conquistasNovas, {});
    }
  },

  async down(queryInterface, Sequelize) {
    // A lógica 'down' pode continuar a mesma, apaga tudo
    await queryInterface.bulkDelete("conquistas", null, {});
  },
};
