const cron = require('node-cron');
const { Op } = require('sequelize');
const compromissoServico = require('../servicos/compromisso.servico');
const verificarAssinaturas = require('./verificarAssinaturas'); // 1. Importar a nova função

// Função que inicia as tarefas agendadas
exports.iniciarTarefas = (conexao) => {
  const { Compromisso, Usuario } = conexao.models; // Adicionar Usuario para a tarefa de teste
  
  console.log('Agendador de tarefas iniciado.');

  // Agenda a tarefa para rodar a cada hora, no minuto 0.
  cron.schedule('0 * * * *', async () => {
    console.log('Rodando tarefa agendada: Verificando compromissos passados...');
    
    try {
      const compromissosPassados = await Compromisso.findAll({
        where: {
          data: { [Op.lt]: new Date() },
          status: 'Agendado'
        }
      });

      if (compromissosPassados.length > 0) {
        for (const compromisso of compromissosPassados) {
          await compromisso.update({ status: 'Realizado' });
          await compromissoServico.processarCompromissoRealizado(compromisso, conexao);
        }
      }
    } catch (erro) {
      console.error('Erro na tarefa agendada de compromissos:', erro);
    }
  });

  // Roda uma vez por dia, à meia-noite.
  cron.schedule('0 * * * *', async () => {
    console.log('Rodando tarefa agendada: Verificando expiração de assinaturas em teste...');
    try {
      const hoje = new Date();
      const [updatedCount] = await Usuario.update(
        { 
          status_assinatura: 'inativa',
          plano: 'free' // Alterado de null para 'free' para consistência
        },
        {
          where: {
            status_assinatura: 'teste',
            teste_termina_em: { [Op.lt]: hoje }
          }
        }
      );

      if (updatedCount > 0) {
        console.log(`${updatedCount} assinaturas em teste expiraram e foram atualizadas.`);
      }
    } catch (erro) {
      console.error('Erro na tarefa de verificação de expiração de testes:', erro);
    }
  });

  // 2. Agendar a verificação de assinaturas ativas para ser executada todos os dias às 03:00 da manhã
  cron.schedule('* * * * *', () => {
    verificarAssinaturas(conexao);
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};