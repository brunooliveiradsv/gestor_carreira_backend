// src/controladores/admin.controlador.js
const bcrypt = require("bcryptjs");

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
    Compromisso,
    Transacao,
    Contato,
    Setlist,
    UsuarioConquista,
    Equipamento,
    Musica,
    Post
  } = conexao.models;
  const { id } = req.params;

  const t = await conexao.transaction();

  try {
    console.log(`Iniciando limpeza de dados completa para o usuário ID: ${id}`);

    await Compromisso.destroy({ where: { usuario_id: id }, transaction: t });
    await Transacao.destroy({ where: { usuario_id: id }, transaction: t });
    await Contato.destroy({ where: { usuario_id: id }, transaction: t });
    await Setlist.destroy({ where: { usuario_id: id }, transaction: t });
    await UsuarioConquista.destroy({ where: { usuario_id: id }, transaction: t });
    await Equipamento.destroy({ where: { usuario_id: id }, transaction: t });
    await Musica.destroy({ where: { usuario_id: id }, transaction: t });
    await Post.destroy({ where: { user_id: id }, transaction: t });

    await t.commit();

    console.log(`Dados do usuário ID: ${id} limpos com sucesso.`);
    return res.status(204).send();
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao limpar dados do usuário:", erro);
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

    // LÓGICA DO TESTE AUTOMÁTICO
    const dataTerminoTeste = new Date();
    dataTerminoTeste.setDate(dataTerminoTeste.getDate() + 7);

    const senhaCriptografada = bcrypt.hashSync(senha, 10);
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaCriptografada,
      role,
      plano: 'premium',
      status_assinatura: 'teste',
      teste_termina_em: dataTerminoTeste
    });
    const { senha: _, ...usuarioSemSenha } = novoUsuario.get({ plain: true });
    return res.status(201).json(usuarioSemSenha);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};


exports.gerenciarAssinatura = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { id } = req.params; // ID do usuário a ser modificado
  const { acao, plano } = req.body; // 'acao' pode ser 'conceder' ou 'remover'

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    if (acao === 'conceder') {
      if (!plano || (plano !== 'padrao' && plano !== 'premium')) {
        return res.status(400).json({ mensagem: "Um plano válido ('padrao' ou 'premium') é obrigatório para conceder uma assinatura." });
      }
      
      await usuario.update({
        plano: plano,
        status_assinatura: 'ativa',
        teste_termina_em: null, // Remove qualquer período de teste
      });
      return res.status(200).json({ mensagem: `Assinatura do plano ${plano} concedida com sucesso!` });

    } else if (acao === 'remover') {
      
      await usuario.update({
        plano: null,
        status_assinatura: 'inativa', // Ou 'cancelada', dependendo da sua regra de negócio
        teste_termina_em: null,
      });
      return res.status(200).json({ mensagem: "Assinatura do usuário removida com sucesso." });

    } else {
      return res.status(400).json({ mensagem: "Ação inválida. Use 'conceder' ou 'remover'." });
    }

  } catch (erro) {
    console.error("Erro ao gerir assinatura de usuário:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};