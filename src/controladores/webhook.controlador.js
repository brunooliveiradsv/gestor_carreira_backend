// src/controladores/webhook.controlador.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const planosStripe = {
  [process.env.STRIPE_PRICE_ID_PADRAO_MENSAL]: 'padrao',
  [process.env.STRIPE_PRICE_ID_PADRAO_ANUAL]: 'padrao',
  [process.env.STRIPE_PRICE_ID_PREMIUM_MENSAL]: 'premium',
  [process.env.STRIPE_PRICE_ID_PREMIUM_ANUAL]: 'premium',
};

// --- FUNÇÃO AUXILIAR MELHORADA ---
// Agora esta função recebe o ID da assinatura e busca os dados mais recentes na Stripe.
const atualizarPlanoDoUsuario = async (conexao, customerId, subscriptionId) => {
    const { Usuario } = conexao.models;

    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const planoId = subscription.items.data[0].price.id;
        const planoEscolhido = planosStripe[planoId];
        const statusAssinatura = subscription.status === 'active' || subscription.status === 'trialing' ? 'ativa' : 'inativa';

        const usuario = await Usuario.findOne({ where: { stripe_customer_id: customerId } });

        if (usuario && planoEscolhido) {
            await usuario.update({
                plano: planoEscolhido,
                status_assinatura: statusAssinatura,
                stripe_subscription_id: subscription.id,
            });
            console.log(`✅ Assinatura (ID: ${subscription.id}) atualizada para o utilizador ${usuario.id}. Plano: ${planoEscolhido}, Status: ${statusAssinatura}`);
        } else {
            console.error(`❌ Tentativa de atualizar assinatura para um cliente Stripe (ID: ${customerId}) que não corresponde a nenhum utilizador.`);
        }
    } catch (error) {
        console.error(`❌ Erro ao buscar ou atualizar a assinatura ${subscriptionId}:`, error);
        // Lança o erro para que o switch principal saiba que algo falhou
        throw error;
    }
};

exports.handleStripeWebhook = async (req, res, conexao) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.log(`❌ Erro na verificação da assinatura do webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { Usuario } = conexao.models;
    const dataObject = event.data.object;

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                // Passamos o ID do cliente e o ID da assinatura para a função auxiliar
                await atualizarPlanoDoUsuario(conexao, dataObject.customer, dataObject.subscription);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                // O dataObject aqui é a própria assinatura, então passamos o seu ID
                await atualizarPlanoDoUsuario(conexao, dataObject.customer, dataObject.id);
                break;
            }

            case 'customer.subscription.deleted': {
                const customerId = dataObject.customer;
                const usuario = await Usuario.findOne({ where: { stripe_customer_id: customerId } });
                if (usuario) {
                    await usuario.update({
                        plano: 'free',
                        status_assinatura: 'cancelada',
                        stripe_subscription_id: null,
                    });
                    console.log(`✅ Assinatura cancelada com sucesso para o utilizador ID: ${usuario.id}`);
                }
                break;
            }
        }
    } catch (error) {
        console.error("❌ Erro ao processar evento de webhook:", error);
        return res.sendStatus(500);
    }

    res.status(200).json({ received: true });
};