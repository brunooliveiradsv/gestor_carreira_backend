// src/controladores/assinatura.controlador.js

// Garante que a chave secreta foi carregada do .env
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('A variável de ambiente STRIPE_SECRET_KEY não está definida.');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.criarSessaoCheckout = async (req, res, conexao) => {
  const { planoId } = req.body;
  const usuarioId = req.usuario.id;

  const success_url = `${process.env.FRONTEND_URL}/configuracoes?pagamento=sucesso`;
  const cancel_url = `${process.env.FRONTEND_URL}/assinatura`;

  try {
    if (!planoId) {
        return res.status(400).json({ mensagem: "ID do plano não foi fornecido pelo frontend." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: usuarioId,
      line_items: [{
        price: planoId,
        quantity: 1,
      }],
      success_url: success_url,
      cancel_url: cancel_url,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Erro CRÍTICO ao criar sessão de checkout do Stripe:", error.message);
    return res.status(500).json({ mensagem: "Não foi possível iniciar o pagamento." });
  }
};

exports.trocarPlano = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { novoPlano } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
    if (usuario.status_assinatura !== 'ativa') {
      return res.status(403).json({ mensagem: "Apenas assinaturas ativas podem ser alteradas." });
    }
    if (!novoPlano || !['padrao', 'premium'].includes(novoPlano)) {
      return res.status(400).json({ mensagem: "Plano inválido." });
    }
    if (usuario.plano === novoPlano) {
      return res.status(400).json({ mensagem: "Você já está neste plano." });
    }

    await usuario.update({
      plano: novoPlano
    });

    const { senha, ...usuarioAtualizado } = usuario.get({ plain: true });

    return res.status(200).json({
      mensagem: `Seu plano foi alterado para ${novoPlano} com sucesso!`,
      usuario: usuarioAtualizado
    });

  } catch (erro) {
    console.error("Erro ao trocar de plano:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor ao tentar trocar de plano." });
  }
};

// --- FUNÇÃO ATUALIZADA E MAIS INTELIGENTE ---
exports.criarSessaoPortal = async (req, res, conexao, next) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const usuario = await Usuario.findByPk(usuarioId);
    const customerId = usuario.stripe_customer_id;

    // CASO 1: O utilizador já é um cliente pagador e tem um ID de cliente
    if (customerId) {
      console.log(`Utilizador ${usuarioId} já tem um Customer ID. A abrir o portal de gestão.`);
      const return_url = `${process.env.FRONTEND_URL}/configuracoes`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: return_url,
      });
      return res.json({ url: portalSession.url });
    }

    // CASO 2: O utilizador está em teste e não tem ID de cliente
    if (usuario.status_assinatura === 'teste') {
      console.log(`Utilizador ${usuarioId} está em teste. A criar uma sessão de checkout para ativar a assinatura.`);
      // Assumimos que o período de teste é sempre do plano 'premium' e o checkout será para o plano mensal
      const priceId = planosStripe.premium_mensal; 
      if (!priceId) {
        return res.status(500).json({ mensagem: "ID do plano Premium não configurado no servidor." });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        client_reference_id: usuarioId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/configuracoes?sucesso=true`,
        cancel_url: `${process.env.FRONTEND_URL}/configuracoes`,
      });
      return res.json({ url: session.url });
    }
    
    // CASO 3: O utilizador não tem assinatura nem está em teste
    return res.status(400).json({ mensagem: "Este utilizador não possui uma assinatura para gerir." });

  } catch (error) {
    next(error);
  }
};