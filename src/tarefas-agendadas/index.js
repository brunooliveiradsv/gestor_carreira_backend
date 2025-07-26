// src/tarefas-agendadas/index.js
const cron = require('node-cron');
const { Op } = require('sequelize');
const compromissoServico = require('../servicos/compromisso.servico');

// Função que inicia as tarefas agendadas
exports.iniciarTarefas = (conexao) => {
  const { Compromisso } = conexao.models;
  
  console.log('Agendador de tarefas iniciado.');

  // Agenda a tarefa para rodar a cada hora, no minuto 0.
  // (ex: 13:00, 14:00, 15:00)
  cron.schedule('0 * * * *', async () => {
    console.log('Rodando tarefa agendada: Verificando compromissos passados...');
    
    try {
      // 1. Encontra compromissos que já passaram, mas ainda estão 'Agendados'
      const compromissosPassados = await Compromisso.findAll({
        where: {
          data: { [Op.lt]: new Date() }, // 'lt' = Less Than (menor que a data/hora atual)
          status: 'Agendado'
        }
      });

      if (compromissosPassados.length > 0) {
        console.log(`Encontrados ${compromissosPassados.length} compromissos para atualizar.`);
        
        // 2. Para cada um, atualiza o status e processa a automação
        for (const compromisso of compromissosPassados) {
          console.log(`Atualizando compromisso ID ${compromisso.id} para "Realizado"...`);
          await compromisso.update({ status: 'Realizado' });
          await compromissoServico.processarCompromissoRealizado(compromisso, conexao);
        }
      } else {
        console.log('Nenhum compromisso para atualizar.');
      }
    } catch (erro) {
      console.error('Erro na tarefa agendada:', erro);
    }
  });
};

// Roda uma vez por dia, à meia-noite.
  cron.schedule('0 0 * * *', async () => {
    console.log('Rodando tarefa agendada: Verificando expiração de assinaturas em teste...');
    try {
      const hoje = new Date();

      // Encontra todos os usuários cujo teste já terminou mas o status ainda é 'teste'
      const [updatedCount] = await Usuario.update(
        { 
          status_assinatura: 'inativa', // Altera o status para inativa
          plano: null // Remove o plano premium associado ao teste
        },
        {
          where: {
            status_assinatura: 'teste',
            teste_termina_em: {
              [Op.lt]: hoje // 'lt' = Less Than (menor que a data/hora atual)
            }
          }
        }
      );

      if (updatedCount > 0) {
        console.log(`${updatedCount} assinaturas em teste expiraram e foram atualizadas para 'inativa'.`);
      } else {
        console.log('Nenhuma assinatura em teste expirou.');
      }
    } catch (erro) {
      console.error('Erro na tarefa de verificação de expiração de testes:', erro);
    }
  });