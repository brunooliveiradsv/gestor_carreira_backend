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
  cron.schedule('* * * * *', async () => {
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