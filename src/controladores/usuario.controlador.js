// src/controladores/usuario.controlador.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailServico = require('../servicos/email.servico');
const logService = require('../servicos/log.servico');
const conquistaServico = require('../servicos/conquista.servico');

exports.atualizarPerfilPublico = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { biografia, url_unica, links_redes, video_destaque_url } = req.body;

  try {
    const usuarioAntes = await Usuario.findByPk(usuarioId);

    if (url_unica) {
      const urlExistente = await Usuario.findOne({
        where: {
          url_unica,
          id: { [conexao.Sequelize.Op.ne]: usuarioId }
        }
      });
      if (urlExistente) {
        return res.status(400).json({ mensagem: "Esta URL já está em uso. Por favor, escolha outra." });
      }
    }

    const dadosParaAtualizar = {};
    if (biografia !== undefined) dadosParaAtualizar.biografia = biografia;
    if (url_unica !== undefined) dadosParaAtualizar.url_unica = url_unica;
    if (links_redes !== undefined) dadosParaAtualizar.links_redes = links_redes;
    if (video_destaque_url !== undefined) dadosParaAtualizar.video_destaque_url = video_destaque_url;

    const [updated] = await Usuario.update(dadosParaAtualizar, {
      where: { id: usuarioId }
    });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      const perfil = usuarioAtualizado.get({ plain: true });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_PUBLIC_PROFILE', { changes: Object.keys(dadosParaAtualizar) });

      if (!usuarioAntes.url_unica && url_unica) {
        conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRA_VITRINE_CRIADA', conexao);
      }

      return res.status(200).json(perfil);
    }
    
    return res.status(404).json({ mensagem: "Usuário não encontrado." });
  } catch (error) {
    console.error("Erro ao atualizar perfil público:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.registrar = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' });
  }

  if (senha.length < 8) {
    return res.status(400).json({ mensagem: "A senha deve ter no mínimo 8 caracteres." });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ where: { email: email } });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'Este e-mail já está em uso.' });
    }

    const dataTerminoTeste = new Date();
    dataTerminoTeste.setDate(dataTerminoTeste.getDate() + 7);

    const senhaCriptografada = bcrypt.hashSync(senha, 10);
    const novoUsuario = await Usuario.create({
      nome, 
      email, 
      senha: senhaCriptografada, 
      role: 'usuario',
      plano: 'premium',
      status_assinatura: 'teste',
      teste_termina_em: dataTerminoTeste
    });

    const token = jwt.sign({ id: novoUsuario.id }, 'nosso_segredo_super_secreto', { expiresIn: '8h' });
    const { senha: _, ...usuarioParaResposta } = novoUsuario.get({ plain: true });
    
    logService.registrarAcao(conexao, novoUsuario.id, 'USER_REGISTER');

    res.status(201).json({ 
      mensagem: 'Usuário registado com sucesso!',
      usuario: usuarioParaResposta,
      token: token
    });

  } catch (erro) {
    console.error("Erro no registo:", erro); 
    res.status(500).json({ mensagem: 'Ocorreu um erro no servidor.' });
  }
};

exports.login = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const usuario = await Usuario.findOne({ where: { email: email } });
    if (!usuario) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'Senha inválida.' });
    }

    const token = jwt.sign(
      { id: usuario.id },
      'nosso_segredo_super_secreto',
      { expiresIn: '8h' }
    );

    const { senha: _, ...usuarioParaResposta } = usuario.get({ plain: true });
    
    logService.registrarAcao(conexao, usuario.id, 'USER_LOGIN');

    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token: token,
      usuario: usuarioParaResposta
    });

  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ mensagem: 'Ocorreu um erro no servidor ao fazer login.' });
  }
};

exports.recuperarSenha = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: 'O e-mail é obrigatório para a recuperação de senha.' });
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(200).json({ mensagem: 'Se um usuário com este e-mail existir, um e-mail de recuperação foi enviado.' });
    }

    const novaSenha = crypto.randomBytes(4).toString('hex');
    const senhaCriptografada = bcrypt.hashSync(novaSenha, 10);

    await usuario.update({ senha: senhaCriptografada });

    const emailEnviado = await emailServico.enviarEmailDeRecuperacao(email, novaSenha);

    if (!emailEnviado) {
      console.error(`A senha do usuário ${email} foi redefinida, mas o e-mail de notificação falhou.`);
    }
    
    logService.registrarAcao(conexao, usuario.id, 'PASSWORD_RECOVERY');

    return res.status(200).json({ mensagem: 'Se um usuário com este e-mail existir, um e-mail de recuperação foi enviado.' });

  } catch (erro) {
    console.error("Erro no processo de recuperação de senha:", erro);
    return res.status(500).json({ mensagem: 'Ocorreu um erro interno no servidor.' });
  }
};


exports.buscarPerfil = async (req, res, conexao) => {
  const { senha, ...perfil } = req.usuario.get({ plain: true });
  return res.status(200).json(perfil);
};

exports.atualizarNome = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ mensagem: "O nome é obrigatório." });
  }

  try {
    const [updated] = await Usuario.update({ nome }, {
      where: { id: usuarioId }
    });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_PROFILE_NAME', { new_name: nome });
      return res.status(200).json(usuarioAtualizado.get({ plain: true }));
    }
    
    return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) {
    console.error("Erro ao atualizar o nome:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizarEmail = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: "O campo de e-mail é obrigatório." });
  }

  try {
    const emailExistente = await Usuario.findOne({ where: { email, id: { [conexao.Sequelize.Op.ne]: usuarioId } } });
    if (emailExistente) {
      return res.status(400).json({ mensagem: "Este e-mail já está sendo utilizado por outra conta." });
    }

    const [updated] = await Usuario.update({ email }, { where: { id: usuarioId } });
    
    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId);
      const { senha, ...perfil } = usuarioAtualizado.get({ plain: true });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_PROFILE_EMAIL', { new_email: email });
      return res.status(200).json(perfil);
    }
    return res.status(404).json({ mensagem: "Usuário não encontrado." });

  } catch (error) {
    console.error("Erro ao atualizar e-mail:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizarSenha = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ mensagem: "A senha atual e a nova senha são obrigatórias." });
  }

  if (novaSenha.length < 8) {
    return res.status(400).json({ mensagem: "A nova senha deve ter no mínimo 8 caracteres." });
  }

  try {
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    const senhaCorreta = bcrypt.compareSync(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "A senha atual está incorreta." });
    }

    const senhaCriptografada = bcrypt.hashSync(novaSenha, 10);
    await usuario.update({ senha: senhaCriptografada });
    
    logService.registrarAcao(conexao, usuarioId, 'UPDATE_PASSWORD');

    return res.status(200).json({ mensagem: "Senha atualizada com sucesso!" });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizarFoto = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;

  if (!req.file) {
    return res.status(400).json({ mensagem: 'Nenhum ficheiro de imagem foi enviado.' });
  }

  const fotoUrl = req.file.path; 

  try {
    const [updated] = await Usuario.update({ foto_url: fotoUrl }, {
      where: { id: usuarioId }
    });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      const perfil = usuarioAtualizado.get({ plain: true });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_PROFILE_PICTURE', { new_url: fotoUrl });
      return res.status(200).json(perfil);
    }
    
    return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) {
    console.error("Erro ao atualizar a foto de perfil:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor ao salvar a foto." });
  }
};

// --- FUNÇÃO ATUALIZADA COM LOG MELHORADO ---
exports.atualizarFotoCapa = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;

  if (!req.file) {
    return res.status(400).json({ mensagem: 'Nenhum ficheiro de imagem foi enviado.' });
  }

  const fotoCapaUrl = req.file.path; 

  try {
    const [updated] = await Usuario.update({ foto_capa_url: fotoCapaUrl }, {
      where: { id: usuarioId }
    });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_COVER_PICTURE', { new_url: fotoCapaUrl });
      return res.status(200).json(usuarioAtualizado.get({ plain: true }));
    }
    
    return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) {
    // --- Log de erro aprimorado ---
    console.error("Erro ao atualizar a foto de capa:", error);
    // Tenta extrair mais detalhes do erro, especialmente se for do Cloudinary
    if (error.response && error.response.data) {
        console.error("Detalhes do erro da resposta:", error.response.data);
    } else if (error.message) {
        console.error("Mensagem de erro:", error.message);
    } else {
        console.error("Objeto de erro completo:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor ao salvar a foto de capa." });
  }
};