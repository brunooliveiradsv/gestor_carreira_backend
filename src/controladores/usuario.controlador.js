// src/controladores/usuario.controlador.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailServico = require('../servicos/email.servico');
const logService = require('../servicos/log.servico');
const conquistaServico = require('../servicos/conquista.servico');

exports.atualizarPerfilPublico = async (req, res, conexao, next) => {
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
    next(error);
  }
};

exports.registrar = async (req, res, conexao, next) => {
  const { Usuario } = conexao.models;
  const { nome, email, senha } = req.body;

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

    const token = jwt.sign({ id: novoUsuario.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const { senha: _, ...usuarioParaResposta } = novoUsuario.get({ plain: true });
    
    logService.registrarAcao(conexao, novoUsuario.id, 'USER_REGISTER');

    res.status(201).json({ 
      mensagem: 'Usuário registado com sucesso!',
      usuario: usuarioParaResposta,
      token: token
    });

  } catch (erro) {
    next(erro);
  }
};

exports.login = async (req, res, conexao, next) => {
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
      process.env.JWT_SECRET,
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
    next(erro);
  }
};

exports.recuperarSenha = async (req, res, conexao, next) => {
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
    next(erro);
  }
};

exports.buscarPerfil = async (req, res, conexao, next) => {
  const { senha, ...perfil } = req.usuario.get({ plain: true });
  return res.status(200).json(perfil);
};

exports.atualizarNome = async (req, res, conexao, next) => {
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
    next(error);
  }
};

exports.atualizarEmail = async (req, res, conexao, next) => {
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
    next(error);
  }
};

exports.atualizarSenha = async (req, res, conexao, next) => {
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
    next(error);
  }
};

exports.atualizarFoto = async (req, res, conexao, next) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { foto_url: fotoUrlFromBody } = req.body; // Pega a URL do corpo da requisição

  // Prioriza o ficheiro enviado. Se não houver ficheiro, usa a URL do corpo.
  const fotoUrlFinal = req.file ? req.file.path : fotoUrlFromBody;

  if (!fotoUrlFinal) {
    return res.status(400).json({ mensagem: 'Nenhum ficheiro ou URL de imagem foi fornecido.' });
  }

  try {
    const [updated] = await Usuario.update({ foto_url: fotoUrlFinal }, {
      where: { id: usuarioId }
    });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      const perfil = usuarioAtualizado.get({ plain: true });
      logService.registrarAcao(conexao, usuarioId, 'UPDATE_PROFILE_PICTURE', { new_url: fotoUrlFinal });
      return res.status(200).json(perfil);
    }
    
    return res.status(404).json({ mensagem: "Utilizador não encontrado." });
  } catch (error) {
    next(error);
  }
};


exports.atualizarFotosCapa = async (req, res, next) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  
  // Recebe um array que representa a ordem final das imagens
  const { ordemCapas } = req.body; 
  const ficheiros = req.files;
  let uploadIndex = 0;

  try {
    let urlsFinais = [];

    if (ordemCapas && Array.isArray(ordemCapas)) {
      urlsFinais = ordemCapas.map(item => {
        // Se o item for um placeholder 'UPLOAD', substitui pelo link do ficheiro correspondente
        if (item === 'UPLOAD') {
          if (ficheiros && ficheiros[uploadIndex]) {
            const url = ficheiros[uploadIndex].path;
            uploadIndex++;
            return url;
          }
          return null; // Caso de segurança
        }
        // Se for um link http, mantém o link
        if (typeof item === 'string' && item.startsWith('http')) {
          return item;
        }
        return null;
      }).filter(url => url !== null); // Remove quaisquer itens nulos
    }

    // Limita a um máximo de 3 imagens
    urlsFinais = urlsFinais.slice(0, 3);

    await Usuario.update({ foto_capa_url: urlsFinais }, {
      where: { id: usuarioId }
    });

    const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
    logService.registrarAcao(conexao, usuarioId, 'UPDATE_COVER_PICTURES');
    return res.status(200).json(usuarioAtualizado.get({ plain: true }));

  } catch (error) {
    next(error);
  }
};