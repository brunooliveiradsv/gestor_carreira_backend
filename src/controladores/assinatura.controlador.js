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