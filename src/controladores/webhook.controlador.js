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

    // Lidar com o evento
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const usuarioId = session.client_reference_id;

        try {
            const usuario = await Usuario.findByPk(usuarioId);
            if (usuario) {
                await usuario.update({
                    status_assinatura: 'ativa',
                    // Aqui você também guardaria o ID da assinatura do Stripe (session.subscription)
                    // para poder geri-la no futuro (cancelamentos, etc.)
                });
                console.log(`✅ Assinatura ativada para o usuário ID: ${usuarioId}`);
            }
        } catch (error) {
            console.error("Erro ao atualizar usuário após pagamento:", error);
            return res.sendStatus(500);
        }
    }

    res.json({ received: true });
};