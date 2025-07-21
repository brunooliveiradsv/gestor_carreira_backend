// src/controladores/assinatura.controlador.js

exports.iniciarTesteGratuito = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const usuario = await Usuario.findByPk(usuarioId);

    // A lógica de verificação continua a mesma
    if (usuario.status_assinatura !== 'inativa' || usuario.teste_termina_em) {
      return res.status(400).json({ mensagem: "Você não pode iniciar um novo período de teste." });
    }

    const dataTermino = new Date();
    dataTermino.setDate(dataTermino.getDate() + 7);

    // CORREÇÃO: O teste agora define o plano como 'premium'
    await usuario.update({
      plano: 'premium', // O teste dá acesso ao melhor plano
      status_assinatura: 'teste',
      teste_termina_em: dataTermino,
    });
    
    const { senha, ...usuarioAtualizado } = usuario.get({ plain: true });

    return res.status(200).json({
      mensagem: "Teste de 7 dias do plano Premium iniciado com sucesso!",
      usuario: usuarioAtualizado,
    });

  } catch (erro) {
    console.error("Erro ao iniciar período de teste:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.criarSessaoCheckout = async (req, res, conexao) => {
  const { plano, planoId } = req.body; // 'planoId' virá do seu painel Stripe
  const usuarioId = req.usuario.id;

  // URL para onde o usuário será redirecionado após o pagamento
  const success_url = `${process.env.FRONTEND_URL}/pagamento-sucesso`;
  const cancel_url = `${process.env.FRONTEND_URL}/assinatura`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // Importante: define que é uma assinatura
      client_reference_id: usuarioId, // Guarda o ID do nosso usuário
      line_items: [{
        price: planoId, // O ID do preço do plano no Stripe
        quantity: 1,
      }],
      success_url: success_url,
      cancel_url: cancel_url,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout do Stripe:", error);
    return res.status(500).json({ mensagem: "Não foi possível iniciar o pagamento." });
  }
};

exports.trocarPlano = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { novoPlano } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const usuario = await Usuario.findByPk(usuarioId);

    // Validações
    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }
    if (usuario.status_assinatura !== 'ativa') {
      return res.status(403).json({ mensagem: "Apenas assinaturas ativas podem ser alteradas." });
    }
    if (!novoPlano || (novoPlano !== 'padrao' && novoPlano !== 'premium')) {
      return res.status(400).json({ mensagem: "Plano inválido." });
    }
    if (usuario.plano === novoPlano) {
      return res.status(400).json({ mensagem: "Você já está neste plano." });
    }

    // Atualiza o plano do usuário
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