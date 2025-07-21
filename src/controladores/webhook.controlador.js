// src/controladores/webhook.controlador.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Objeto para mapear os Price IDs do Stripe para os nomes dos seus planos.
// É mais seguro obter estes valores das variáveis de ambiente.
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

    // 1. Verificação de Segurança do Webhook
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log(`✅ Webhook verificado com sucesso. Evento: ${event.type}`);
    } catch (err) {
        console.log(`❌ Erro na verificação da assinatura do webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const { Usuario } = conexao.models;
    const session = event.data.object;

    // 2. Lógica para cada tipo de evento
    switch (event.type) {
        case 'checkout.session.completed': {
            const usuarioId = session.client_reference_id;
            const customerId = session.customer;

            if (!usuarioId || !customerId) {
                console.error('❌ Webhook checkout.session.completed sem usuarioId ou customerId.');
                return res.status(400).send('Dados em falta no evento.');
            }

            // Precisamos de obter os detalhes da subscrição para saber o plano
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const planoId = subscription.items.data[0].price.id;
            const planoEscolhido = planosStripe[planoId];

            console.log(`> Processando checkout para Usuário ID: ${usuarioId}, Cliente Stripe ID: ${customerId}, Plano: ${planoEscolhido}`);

            try {
                const usuario = await Usuario.findByPk(usuarioId);
                if (usuario) {
                    await usuario.update({
                        status_assinatura: 'ativa',
                        stripe_customer_id: customerId,
                        plano: planoEscolhido || null,
                    });
                    console.log(`✅ Assinatura ativada com sucesso para o usuário ID: ${usuarioId}`);
                } else {
                    console.error(`❌ Usuário com ID ${usuarioId} não encontrado no banco de dados.`);
                }
            } catch (error) {
                console.error("❌ Erro ao atualizar usuário após pagamento:", error);
                return res.sendStatus(500);
            }
            break;
        }

        // Adicione aqui outros 'case' para 'customer.subscription.updated', etc. no futuro
    }

    // 3. Resposta de Sucesso para o Stripe
    res.status(200).json({ received: true });
};