exports.listar = async (req, res, conexao) => {
  const { Notificacao, Conquista } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const notificacoes = await Notificacao.findAll({
      where: { usuario_id: usuarioId },
      order: [['created_at', 'DESC']],
      limit: 20,
      include: [{ model: Conquista, as: 'conquista', attributes: ['tipo_condicao'] }]
    });
    return res.status(200).json(notificacoes);
  } catch (erro) {
    console.error("Erro ao listar notificações:", erro);
    return res.status(500).json({ mensagem: "Erro ao buscar notificações." });
  }
};

exports.marcarComoLida = async (req, res, conexao) => {
  const { Notificacao } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const [updated] = await Notificacao.update({ lida: true }, {
      where: { id: id, usuario_id: usuarioId }
    });
    if (updated) {
      return res.status(200).json({ mensagem: "Notificação marcada como lida." });
    }
    return res.status(404).json({ mensagem: "Notificação não encontrada." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao marcar notificação como lida." });
  }
};

exports.marcarTodasComoLidas = async (req, res, conexao) => {
  const { Notificacao } = conexao.models;
  const usuarioId = req.usuario.id; // Vem do middleware de autenticação

  try {
    // Atualiza todas as notificações do usuário logado que não estão lidas
    await Notificacao.update(
      { lida: true },
      { where: { usuario_id: usuarioId, lida: false } }
    );
    return res.status(200).json({ mensagem: "Todas as notificações marcadas como lidas." });
  } catch (erro) {
    console.error("Erro ao marcar todas as notificações como lidas no DB:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro ao marcar todas as notificações como lidas." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Notificacao } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Notificacao.destroy({ where: { id: id, usuario_id: usuarioId }});
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Notificação não encontrada." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.limparTodas = async (req, res, conexao) => {
  const { Notificacao } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    await Notificacao.destroy({ where: { usuario_id: usuarioId } });
    return res.status(204).send();
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};