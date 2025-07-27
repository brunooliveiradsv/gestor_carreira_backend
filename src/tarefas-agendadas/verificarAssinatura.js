// src/tarefas-agendadas/verificarAssinaturas.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Procura por todos os utilizadores com assinaturas ativas na base de dados
 * e verifica o estado real de cada assinatura na Stripe.
 * Se uma assinatura estiver cancelada ou com pagamento em falta,
 * reverte o plano do utilizador para 'free'.
 */
async function verificarAssinaturas(conexao) {
  const { Usuario } = conexao.models;
  console.log('🔄 Iniciando tarefa de verificação de assinaturas...');

  try {
    // 1. Encontra todos os utilizadores que, na nossa base de dados, têm uma assinatura ativa
    const usuariosComAssinatura = await Usuario.findAll({
      where: {
        status_assinatura: 'ativa',
        stripe_subscription_id: {
          [conexao.Sequelize.Op.ne]: null // Garante que só procuramos quem tem um ID de assinatura
        }
      }
    });

    if (usuariosComAssinatura.length === 0) {
      console.log('✅ Nenhuma assinatura ativa para verificar.');
      return;
    }

    console.log(`🔎 Encontradas ${usuariosComAssinatura.length} assinaturas para verificar...`);

    // 2. Itera sobre cada utilizador e verifica a sua assinatura na Stripe
    for (const usuario of usuariosComAssinatura) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          usuario.stripe_subscription_id
        );

        // 3. Compara o estado da Stripe com o da nossa base de dados
        const statusNaStripe = subscription.status; // ex: 'active', 'canceled', 'past_due'

        if (statusNaStripe !== 'active' && statusNaStripe !== 'trialing') {
          console.log(`❗️ Assinatura [${subscription.id}] para o utilizador ${usuario.id} não está ativa (${statusNaStripe}). A reverter para o plano Free.`);
          
          // 4. Se a assinatura não estiver ativa, reverte o plano do utilizador
          await usuario.update({
            plano: 'free',
            status_assinatura: 'cancelada', // Ou 'inativa', dependendo da sua preferência
          });
        }
      } catch (stripeError) {
        // Este erro pode acontecer se a assinatura foi completamente removida no Stripe
        if (stripeError.code === 'resource_missing') {
          console.error(`🚨 Assinatura [${usuario.stripe_subscription_id}] não encontrada no Stripe para o utilizador ${usuario.id}. A reverter para o plano Free.`);
          await usuario.update({
            plano: 'free',
            status_assinatura: 'cancelada',
          });
        } else {
          console.error(`❌ Erro ao verificar a assinatura [${usuario.stripe_subscription_id}] na Stripe:`, stripeError.message);
        }
      }
    }

    console.log('✅ Tarefa de verificação de assinaturas concluída.');

  } catch (dbError) {
    console.error('❌ Erro geral ao executar a verificação de assinaturas:', dbError);
  }
}

module.exports = verificarAssinaturas;