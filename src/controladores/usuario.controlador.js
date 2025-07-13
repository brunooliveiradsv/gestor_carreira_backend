// src/controladores/usuario.controlador.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Módulo nativo do Node.js para criptografia
const emailServico = require('../servicos/email.servico'); // Nosso novo serviço de e-mail

exports.registrar = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { nome, email, senha } = req.body;

  // Validação dos campos básicos
  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios!' });
  }

  // --- NOVA VALIDAÇÃO DE TAMANHO DA SENHA ---
  if (senha.length < 8) {
    return res.status(400).json({ mensagem: "A senha deve ter no mínimo 8 caracteres." });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ where: { email: email } });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: 'Este e-mail já está em uso.' });
    }

    const senhaCriptografada = bcrypt.hashSync(senha, 10);
    const novoUsuario = await Usuario.create({
      nome, email, senha: senhaCriptografada, role: 'usuario'
    });

    const token = jwt.sign({ id: novoUsuario.id }, 'nosso_segredo_super_secreto', { expiresIn: '8h' });
    const usuarioParaResposta = { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email };
    
    res.status(201).json({ 
      mensagem: 'Usuário registrado com sucesso!',
      usuario: usuarioParaResposta,
      token: token
    });

  } catch (erro) {
    console.error("Erro no registro:", erro); 
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
      'nosso_segredo_super_secreto', // Use uma variável de ambiente para isso em produção!
      { expiresIn: '8h' }
    );

    // Retorna os dados do usuário (sem a senha) junto com o token
    const usuarioParaResposta = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };

    res.status(200).json({
      mensagem: 'Login bem-sucedido!',
      token: token,
      usuario: usuarioParaResposta // Adicionado para o frontend ter os dados do usuário
    });

  } catch (erro) {
    console.error("Erro no login:", erro);
    res.status(500).json({ mensagem: 'Ocorreu um erro no servidor ao fazer login.' });
  }
};

// --- FUNÇÃO NOVA: RECUPERAR SENHA ---
exports.recuperarSenha = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: 'O e-mail é obrigatório para a recuperação de senha.' });
  }

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    // Mesmo que o usuário não exista, retornamos uma mensagem de sucesso
    // para não dar pistas a possíveis atacantes se um e-mail está cadastrado ou não.
    if (!usuario) {
      return res.status(200).json({ mensagem: 'Se um usuário com este e-mail existir, um link de recuperação foi enviado.' });
    }

    // Gera uma nova senha aleatória de 8 caracteres
    const novaSenha = crypto.randomBytes(4).toString('hex');
    const senhaCriptografada = bcrypt.hashSync(novaSenha, 10);

    // Atualiza o usuário com a nova senha
    await usuario.update({ senha: senhaCriptografada });

    // Envia o e-mail para o usuário
    const emailEnviado = await emailServico.enviarEmailDeRecuperacao(email, novaSenha);

    if (!emailEnviado) {
      // Se o e-mail falhar, não devemos travar o processo para o usuário.
      // A senha foi alterada, mas o ideal é logar o erro para a administração verificar.
      console.error(`A senha do usuário ${email} foi redefinida, mas o e-mail de notificação falhou.`);
    }

    return res.status(200).json({ mensagem: 'Se um usuário com este e-mail existir, um e-mail de recuperação foi enviado.' });

  } catch (erro) {
    console.error("Erro no processo de recuperação de senha:", erro);
    return res.status(500).json({ mensagem: 'Ocorreu um erro interno no servidor.' });
  }
};


exports.buscarPerfil = async (req, res, conexao) => {
  // req.usuario é definido pelo authMiddleware e contém o objeto do usuário autenticado
  // Garante que a senha não seja enviada na resposta
  const { senha, ...perfil } = req.usuario.get({ plain: true });
  return res.status(200).json(perfil);
};

// --- FUNÇÃO NOVA: ATUALIZAR E-MAIL ---
exports.atualizarEmail = async (req, res, conexao) => {
  const { Usuario } = conexao.models;
  const usuarioId = req.usuario.id;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: "O campo de e-mail é obrigatório." });
  }

  try {
    // Verifica se o novo e-mail já está em uso por outro usuário
    const emailExistente = await Usuario.findOne({ where: { email, id: { [conexao.Sequelize.Op.ne]: usuarioId } } });
    if (emailExistente) {
      return res.status(400).json({ mensagem: "Este e-mail já está sendo utilizado por outra conta." });
    }

    const [updated] = await Usuario.update({ email }, { where: { id: usuarioId } });
    
    if (updated) {
      const usuarioAtualizado = await Usuario.findByPk(usuarioId);
      const { senha, ...perfil } = usuarioAtualizado.get({ plain: true });
      return res.status(200).json(perfil);
    }
    return res.status(404).json({ mensagem: "Usuário não encontrado." });

  } catch (error) {
    console.error("Erro ao atualizar e-mail:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

// --- FUNÇÃO NOVA: ATUALIZAR SENHA ---
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

    // Compara a senha atual enviada com a que está no banco
    const senhaCorreta = bcrypt.compareSync(senhaAtual, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "A senha atual está incorreta." });
    }

    // Criptografa e salva a nova senha
    const senhaCriptografada = bcrypt.hashSync(novaSenha, 10);
    await usuario.update({ senha: senhaCriptografada });

    return res.status(200).json({ mensagem: "Senha atualizada com sucesso!" });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};