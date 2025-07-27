// src/controladores/webhook.controlador.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Objeto para mapear os Price IDs do Stripe para os nomes dos seus planos.
const planosStripe = {
  [process.env.STRIPE_PRICE_ID_PADRAO_MENSAL]: 'padrao',
  [process.env.STRIPE_PRICE_ID_PADRAO_ANUAL]: 'padrao',
  [process.env.STRIPE_PRICE_ID_PREMIUM_MENSAL]: 'premium',
  [process.env.STRIPE_PRICE_ID_PREMIUM_ANUAL]: 'premium',
};

exports.handleStripeWebhook = async (req, res, conexao) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log(`✅ Webhook verificado com sucesso. Evento: ${event.type}`);
    } catch (err) {
        console.log(`❌ Erro na verificação da assinatura do webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { Usuario } = conexao.models;
    const session = event.data.object;

    // Lógica para cada tipo de evento
    switch (event.type) {
        case 'checkout.session.completed': {
            const usuarioId = session.client_reference_id;
            const customerId = session.customer;
            const subscriptionId = session.subscription;

            if (!usuarioId || !customerId) {
                console.error('❌ Webhook checkout.session.completed sem usuarioId ou customerId.');
                return res.status(400).send('Dados em falta no evento.');
            }

            try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const planoId = subscription.items.data[0].price.id;
                const planoEscolhido = planosStripe[planoId];

                console.log(`> Processando checkout para Usuário ID: ${usuarioId}, Cliente Stripe ID: ${customerId}, Plano: ${planoEscolhido}`);

                const usuario = await Usuario.findByPk(usuarioId);
                if (usuario && planoEscolhido) {
                    await usuario.update({
                        status_assinatura: 'ativa',
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId,
                        plano: planoEscolhido,
                    });
                    console.log(`✅ Assinatura ativada com sucesso para o usuário ID: ${usuarioId}`);
                }
            } catch (error) {
                console.error("❌ Erro ao atualizar usuário após pagamento:", error);
                return res.sendStatus(500);
            }
            break;
        }

        // Evento acionado quando uma assinatura é criada ou alterada diretamente no Stripe
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            const planoId = subscription.items.data[0].price.id;
            const planoEscolhido = planosStripe[planoId];
            const statusAssinatura = subscription.status;

            console.log(`> Processando atualização de assinatura para Cliente Stripe ID: ${customerId}`);

            try {
                const usuario = await Usuario.findOne({ where: { stripe_customer_id: customerId } });
                if (usuario && (statusAssinatura === 'active' || statusAssinatura === 'trialing')) {
                    await usuario.update({
                        plano: planoEscolhido || 'free',
                        status_assinatura: 'ativa',
                        stripe_subscription_id: subscription.id,
                    });
                    console.log(`✅ Assinatura atualizada com sucesso para o usuário ID: ${usuario.id}`);
                }
            } catch (error) {
                console.error("❌ Erro ao processar atualização de assinatura:", error);
                return res.sendStatus(500);
            }
            break;
        }

        // Evento acionado quando uma assinatura é cancelada ou expira
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer;
            console.log(`> Processando cancelamento para Cliente Stripe ID: ${customerId}`);

            try {
                const usuario = await Usuario.findOne({ where: { stripe_customer_id: customerId } });
                if (usuario) {
                    await usuario.update({
                        plano: 'free',
                        status_assinatura: 'cancelada',
                        stripe_subscription_id: null,
                    });
                    console.log(`✅ Assinatura cancelada com sucesso para o usuário ID: ${usuario.id}`);
                }
            } catch (error) {
                console.error("❌ Erro ao processar cancelamento de assinatura:", error);
                return res.sendStatus(500);
            }
            break;
        }
    }

    res.status(200).json({ received: true });
};