// src/controladores/usuario.controlador.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailServico = require('../servicos/email.servico');
const logService = require('../servicos/log.servico');
const conquistaServico = require('../servicos/conquista.servico');

exports.atualizarPerfilPublico = async (req, res, conexao, next) => {
  if (req.usuario.plano !== 'premium') {
    return res.status(403).json({ 
      mensagem: "Apenas utilizadores do plano Premium podem ter uma página pública.",
      upgradeNecessario: true
    });
  }
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

    const senhaCriptografada = bcrypt.hashSync(senha, 10);
    const novoUsuario = await Usuario.create({
      nome, 
      email, 
      senha: senhaCriptografada, 
      role: 'usuario',
      plano: 'free',
      status_assinatura: 'ativa',
      teste_termina_em: null
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

exports.atualizarPerfil = async (req, res, conexao, next) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { nome, email } = req.body;

  try {
    const dadosParaAtualizar = {};

    if (nome) {
      // Lógica de validação do nome, se houver
      dadosParaAtualizar.nome = nome;
    }

    if (email) {
      // Validação para garantir que o novo e-mail não está em uso por outra conta
      const emailExistente = await Usuario.findOne({ 
        where: { email, id: { [conexao.Sequelize.Op.ne]: usuarioId } } 
      });
      if (emailExistente) {
        return res.status(400).json({ mensagem: "Este e-mail já está sendo utilizado por outra conta." });
      }
      dadosParaAtualizar.email = email;
    }

    if (Object.keys(dadosParaAtualizar).length === 0) {
        return res.status(400).json({ mensagem: "Nenhum dado para atualizar foi fornecido." });
    }

    const [updated] = await Usuario.update(dadosParaAtualizar, { where: { id: usuarioId } });

    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
      return res.status(200).json(usuarioAtualizado.get({ plain: true }));
    }

    // Este caso é raro, mas é uma boa prática
    return res.status(404).json({ mensagem: "Utilizador não encontrado." });

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
  
  // --- CORREÇÃO AQUI ---
  // Em vez de depender do req.body, que pode estar vazio em uploads,
  // verificamos diretamente se req.file (do multer) existe.
  const fotoUrlFinal = req.file ? req.file.path : null;

  if (!fotoUrlFinal) {
    // A lógica original para lidar com a ausência de um ficheiro
    const { foto_url: fotoUrlFromBody } = req.body || {};
    if (!fotoUrlFromBody) {
        return res.status(400).json({ mensagem: 'Nenhum ficheiro ou URL de imagem foi fornecido.' });
    }
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

exports.atualizarFotosCapa = async (req, res, conexao, next) => {
    const { Usuario } = conexao.models;
    const usuarioId = req.usuario.id;
    const { ordemCapas } = req.body;
    const ficheiros = req.files;

    try {
        let uploadIndex = 0;
        const urlsFinais = JSON.parse(ordemCapas).map(item => {
            if (item === 'UPLOAD') {
                const ficheiro = ficheiros[uploadIndex];
                uploadIndex++;
                return ficheiro.path;
            }
            return item;
        });

        const [updated] = await Usuario.update(
            { foto_capa_url: urlsFinais },
            { where: { id: usuarioId } }
        );

        if (updated) {
            const usuarioAtualizado = await Usuario.findByPk(usuarioId, { attributes: { exclude: ['senha'] } });
            logService.registrarAcao(conexao, usuarioId, 'UPDATE_COVER_PICTURES', { count: urlsFinais.length });
            return res.status(200).json(usuarioAtualizado.get({ plain: true }));
        }
        
        return res.status(404).json({ mensagem: "Utilizador não encontrado." });

    } catch (error) {
        next(error);
    }
};