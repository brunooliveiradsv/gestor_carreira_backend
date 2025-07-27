// src/controladores/admin.controlador.js
const bcrypt = require("bcryptjs");

// ... (as outras funções como listarUsuarios, etc., permanecem iguais)
exports.listarUsuarios = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ["senha"] },
    });
    return res.status(200).json(usuarios);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizarUsuario = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { id } = req.params;
  const novosDados = req.body;
  if (novosDados.senha) delete novosDados.senha;
  if (novosDados.id) delete novosDados.id;
  try {
    const [updated] = await Usuario.update(novosDados, { where: { id } });
    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(id, {
        attributes: { exclude: ["senha"] },
      });
      return res.status(200).json(usuarioAtualizado);
    }
    return res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch (erro) {
    return res.status(400).json({ mensagem: "Erro ao atualizar usuário." });
  }
};

exports.apagarUsuario = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { id } = req.params;
  try {
    if (req.usuario.id == id) {
      return res
        .status(403)
        .json({
          mensagem: "Um administrador não pode apagar a própria conta.",
        });
    }
    const deletado = await Usuario.destroy({ where: { id } });
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.limparDadosUsuario = async (req, res, conexao) => {
  const {
    Usuario,
    Compromisso,
    Transacao,
    Contato,
    Setlist,
    UsuarioConquista,
    Equipamento,
    Musica,
    Post,
    Notificacao,
    SugestaoMusica,
    ActivityLog
  } = conexao.models;
  const { id } = req.params;

  const t = await conexao.transaction();

  try {
    console.log(`Iniciando limpeza de dados completa para o utilizador ID: ${id}`);

    await Usuario.update({
        biografia: null,
        url_unica: null,
        links_redes: null,
        foto_capa_url: null,
        video_destaque_url: null,
        aplausos: 0
    }, { where: { id }, transaction: t });

    await Compromisso.destroy({ where: { usuario_id: id }, transaction: t });
    await Transacao.destroy({ where: { usuario_id: id }, transaction: t });
    await UsuarioConquista.destroy({ where: { usuario_id: id }, transaction: t });
    await Equipamento.destroy({ where: { usuario_id: id }, transaction: t });
    await Musica.destroy({ where: { usuario_id: id }, transaction: t });
    await Post.destroy({ where: { user_id: id }, transaction: t });
    
    await Contato.destroy({ where: { usuario_id: id }, transaction: t });
    await Setlist.destroy({ where: { usuario_id: id }, transaction: t });
    await Notificacao.destroy({ where: { usuario_id: id }, transaction: t });
    await SugestaoMusica.destroy({ where: { usuario_id: id }, transaction: t });
    await ActivityLog.destroy({ where: { user_id: id }, transaction: t });

    await t.commit();

    console.log(`Dados do utilizador ID: ${id} limpos com sucesso.`);
    return res.status(204).send();
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao limpar dados do utilizador:", erro);
    return res
      .status(500)
      .json({ mensagem: "Ocorreu um erro no servidor ao limpar os dados." });
  }
};

exports.criarUsuario = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha || !role) {
    return res
      .status(400)
      .json({ mensagem: "Nome, e-mail, senha e nível são obrigatórios." });
  }
  try {
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: "Este e-mail já está em uso." });
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 10);
    
    // --- INÍCIO DA CORREÇÃO ---
    // Remove a lógica de período de teste e define os padrões corretos
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaCriptografada,
      role,
      plano: 'free',
      status_assinatura: 'inativa',
    });
    // --- FIM DA CORREÇÃO ---

    const { senha: _, ...usuarioSemSenha } = novoUsuario.get({ plain: true });
    return res.status(201).json(usuarioSemSenha);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.gerenciarAssinatura = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { id } = req.params;
  const { acao, plano } = req.body;

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    if (acao === 'conceder') {
      if (!plano || !['free', 'padrao', 'premium'].includes(plano)) {
        return res.status(400).json({ mensagem: 'Plano inválido especificado.' });
      }
      
      usuario.plano = plano;
      usuario.status_assinatura = 'ativa';
      await usuario.save();
      return res.status(200).json({ mensagem: `Plano ${plano} concedido com sucesso para ${usuario.nome}.` });

    } else if (acao === 'remover') {
      usuario.plano = 'free';
      usuario.status_assinatura = 'ativa';
      await usuario.save();
      return res.status(200).json({ mensagem: `Assinatura de ${usuario.nome} removida. O utilizador foi movido para o plano Free.` });
    
    } else {
      return res.status(400).json({ mensagem: 'Ação de gerenciamento de assinatura inválida.' });
    }

  } catch (error) {
    console.error("Erro ao gerenciar assinatura do usuário:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro interno ao gerenciar a assinatura.", erro: error.message });
  }
};