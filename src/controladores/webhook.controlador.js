// src/controladores/webhook.controlador.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const session = event.data.object;

    // Usamos um switch para lidar com diferentes tipos de eventos
    switch (event.type) {
        case 'checkout.session.completed': {
            const usuarioId = session.client_reference_id;
            const customerId = session.customer;
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const planoId = subscription.items.data[0].price.id;

            // Mapeie os seus Price IDs para os nomes dos planos
            const planosStripe = {
                [process.env.STRIPE_PRICE_ID_PADRAO_MENSAL]: 'padrao',
                [process.env.STRIPE_PRICE_ID_PADRAO_ANUAL]: 'padrao',
                [process.env.STRIPE_PRICE_ID_PREMIUM_MENSAL]: 'premium',
                [process.env.STRIPE_PRICE_ID_PREMIUM_ANUAL]: 'premium',
            };
            
            try {
                const usuario = await Usuario.findByPk(usuarioId);
                if (usuario) {
                    await usuario.update({
                        status_assinatura: 'ativa',
                        stripe_customer_id: customerId, // <-- GUARDA O CUSTOMER ID
                        plano: planosStripe[planoId] || null,
                    });
                    console.log(`✅ Assinatura ativada para o usuário ID: ${usuarioId}`);
                }
            } catch (error) {
                console.error("Erro ao atualizar usuário após pagamento:", error);
                return res.sendStatus(500);
            }
            break;
        }

        case 'customer.subscription.updated': {
            const customerId = session.customer;
            const planoId = session.items.data[0].price.id;
            const planosStripe = { /* ... seu mapeamento de planos ... */ };

            try {
                await Usuario.update(
                    { plano: planosStripe[planoId] || null },
                    { where: { stripe_customer_id: customerId } }
                );
                console.log(`✅ Plano atualizado para o cliente: ${customerId}`);
            } catch (error) {
                console.error("Erro ao atualizar plano via webhook:", error);
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const customerId = session.customer;
            try {
                await Usuario.update(
                    { status_assinatura: 'cancelada', plano: null },
                    { where: { stripe_customer_id: customerId } }
                );
                console.log(`✅ Assinatura cancelada para o cliente: ${customerId}`);
            } catch (error) {
                console.error("Erro ao cancelar assinatura via webhook:", error);
            }
            break;
        }
    }

    res.json({ received: true });
};