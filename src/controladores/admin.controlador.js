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

// --- FUNÇÃO PRINCIPAL AGORA COM TODAS AS DELEÇÕES NECESSÁRIAS ---
exports.limparDadosUsuario = async (req, res, conexao) => {
  const {
    Usuario,
    Compromisso,
    Transacao,
    Contato,          // Adicionado para DESTRUIR Contatos
    Setlist,          // Adicionado para DESTRUIR Setlists
    UsuarioConquista,
    Equipamento,
    Musica,
    Post,
    Notificacao,      // Adicionado para DESTRUIR Notificações
    SugestaoMusica,   // Adicionado para DESTRUIR Sugestões (se a intenção for apagar)
    ActivityLog       // Adicionado para DESTRUIR Logs de Atividade
  } = conexao.models;
  const { id } = req.params;

  const t = await conexao.transaction();

  try {
    console.log(`Iniciando limpeza de dados completa para o utilizador ID: ${id}`);

    // Passo 1: Redefine as configurações da Vitrine na tabela de utilizadores
    await Usuario.update({
        biografia: null,
        url_unica: null,
        links_redes: null,
        foto_capa_url: null,
        video_destaque_url: null,
        aplausos: 0
    }, { where: { id }, transaction: t });

    // Passo 2: Apaga todos os dados transacionais e relacionados
    await Compromisso.destroy({ where: { usuario_id: id }, transaction: t });
    await Transacao.destroy({ where: { usuario_id: id }, transaction: t });
    await UsuarioConquista.destroy({ where: { usuario_id: id }, transaction: t });
    await Equipamento.destroy({ where: { usuario_id: id }, transaction: t });
    await Musica.destroy({ where: { usuario_id: id }, transaction: t });
    await Post.destroy({ where: { user_id: id }, transaction: t });
    
    // --- NOVAS DELEÇÕES PARA GARANTIR LIMPEZA COMPLETA ---
    await Contato.destroy({ where: { usuario_id: id }, transaction: t }); // Deleta todos os contatos do usuário
    await Setlist.destroy({ where: { usuario_id: id }, transaction: t }); // Deleta todos os setlists do usuário
    await Notificacao.destroy({ where: { usuario_id: id }, transaction: t }); // Deleta todas as notificações do usuário
    await SugestaoMusica.destroy({ where: { usuario_id: id }, transaction: t }); // Deleta todas as sugestões feitas pelo usuário
    await ActivityLog.destroy({ where: { user_id: id }, transaction: t }); // Deleta todos os logs de atividade do usuário

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

// --- NOVA FUNÇÃO PARA GERENCIAR ASSINATURAS ---
exports.gerenciarAssinatura = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { id } = req.params;
  const { acao, plano } = req.body; // 'acao' pode ser 'conceder' ou 'remover'

  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    if (acao === 'conceder') {
      if (!plano || (plano !== 'padrao' && plano !== 'premium')) {
        return res.status(400).json({ mensagem: 'Plano inválido especificado.' });
      }
      usuario.plano = plano;
      usuario.status_assinatura = 'ativa'; // Ou 'teste' se você quiser conceder um teste específico
      usuario.teste_termina_em = null; // Remove a data de término de teste se um plano for concedido
      await usuario.save();
      return res.status(200).json({ mensagem: `Plano ${plano} concedido com sucesso para ${usuario.nome}.` });
    } else if (acao === 'remover') {
      usuario.plano = null;
      usuario.status_assinatura = 'inativa';
      usuario.teste_termina_em = null; // Limpa a data de término de teste
      // TODO: Se você tiver integração com Stripe ou outro serviço de pagamento,
      // adicione aqui a lógica para cancelar a assinatura nesse serviço.
      await usuario.save();
      return res.status(200).json({ mensagem: `Assinatura de ${usuario.nome} removida com sucesso.` });
    } else {
      return res.status(400).json({ mensagem: 'Ação de gerenciamento de assinatura inválida.' });
    }

  } catch (error) {
    console.error("Erro ao gerenciar assinatura do usuário:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro interno ao gerenciar a assinatura.", erro: error.message });
  }
};