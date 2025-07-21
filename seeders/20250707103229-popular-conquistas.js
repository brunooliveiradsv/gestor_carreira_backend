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
      // Assinatura e Vitrine
      { nome: "Artista Premium", descricao: "Tornou-se um assinante do VOXGest.", tipo_condicao: "ASSINATURA_ATIVA", valor_condicao: 1, },
      { nome: "Meu Espaço na Web", descricao: "Criou e salvou sua página pública (Vitrine) pela primeira vez.", tipo_condicao: "PRIMEIRA_VITRINE_CRIADA", valor_condicao: 1, },
      { nome: "Aclamação Popular", descricao: "Recebeu 10 aplausos na sua página Vitrine.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 10, },
      { nome: "Querido Pelo Público", descricao: "Recebeu 50 aplausos na sua página Vitrine.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 50, },
      { nome: "Ídolo Local", descricao: "Recebeu 100 aplausos na sua página Vitrine.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 100, },
      { nome: "Estrela em Ascensão", descricao: "Recebeu 500 aplausos na sua página Vitrine.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 500, },
      { nome: "Fenómeno", descricao: "Alcançou a marca de 1.000 aplausos na sua página Vitrine.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 1000, },
      { nome: "Superstar", descricao: "Alcançou a incrível marca de 5.000 aplausos.", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 5000, },
      { nome: "Lenda Viva", descricao: "Alcançou o status lendário com 10.000 aplausos!", tipo_condicao: "CONTAGEM_APLAUSOS", valor_condicao: 10000, },

      // Repertório e Colaboração
      { nome: "Colecionador Musical", descricao: "Adicionou 10 músicas ao seu repertório.", tipo_condicao: "CONTAGEM_MUSICAS", valor_condicao: 10, },
      { nome: "Musicólogo", descricao: "Adicionou 50 músicas ao seu repertório.", tipo_condicao: "CONTAGEM_MUSICAS", valor_condicao: 50, },
      { nome: "O Colaborador", descricao: "Teve sua primeira sugestão de melhoria de música aprovada.", tipo_condicao: "SUGESTAO_APROVADA", valor_condicao: 1, },

    ].map((c) => ({ ...c, created_at: new Date(), updated_at: new Date() }));

    const conquistasExistentes = await queryInterface.sequelize.query(
      `SELECT nome FROM conquistas;`
    );
    const nomesExistentes = conquistasExistentes[0].map((c) => c.nome);
    const conquistasNovas = conquistasParaAdicionar.filter(
      (c) => !nomesExistentes.includes(c.nome)
    );

    if (conquistasNovas.length > 0) {
      await queryInterface.bulkInsert("conquistas", conquistasNovas, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("conquistas", null, {});
  },
};