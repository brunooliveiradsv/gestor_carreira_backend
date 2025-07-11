// src/controladores/contato.controlador.js
const conquistaServico = require('../servicos/conquista.servico');

exports.criar = async (req, res, conexao) => {
  const { Contato } = conexao.models;
  const { nome, telefone, email, funcao } = req.body;
  const usuarioId = req.usuario.id;
  try {
    const novoContato = await Contato.create({ nome, telefone, email, funcao, usuario_id: usuarioId });
    conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_CONTATOS', conexao);
    return res.status(201).json(novoContato);
  } catch (erro) {
    console.error("Erro ao criar contato:", erro);
    return res.status(400).json({ mensagem: "Erro ao criar contato." });
  }
};

exports.listar = async (req, res, conexao) => {
  const { Contato } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const contatos = await Contato.findAll({ where: { usuario_id: usuarioId }, order: [['nome', 'ASC']] });
    return res.status(200).json(contatos);
  } catch (erro) {
    console.error("Erro ao listar contatos:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

// --- FUNÇÃO NOVA ---
exports.buscarPorId = async (req, res, conexao) => {
  const { Contato } = conexao.models;
  const idDoContato = req.params.id;
  const usuarioId = req.usuario.id;
  try {
    const contato = await Contato.findOne({ where: { id: idDoContato, usuario_id: usuarioId } });
    if (!contato) {
      return res.status(404).json({ mensagem: "Contato não encontrado." });
    }
    return res.status(200).json(contato);
  } catch (erro) {
    console.error("Erro ao buscar contato por ID:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Contato } = conexao.models;
  const idDoContato = req.params.id;
  const usuarioId = req.usuario.id;
  const novosDados = req.body;
  try {
    const [updated] = await Contato.update(novosDados, { where: { id: idDoContato, usuario_id: usuarioId }});
    if (updated) {
      const contatoAtualizado = await Contato.findByPk(idDoContato);
      return res.status(200).json(contatoAtualizado);
    }
    return res.status(404).json({ mensagem: "Contato não encontrado ou não pertence ao usuário." });
  } catch (erro) {
    console.error("Erro ao atualizar contato:", erro);
    return res.status(400).json({ mensagem: "Erro ao atualizar contato." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Contato } = conexao.models;
  const idDoContato = req.params.id;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Contato.destroy({ where: { id: idDoContato, usuario_id: usuarioId }});
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Contato não encontrado ou não pertence ao usuário." });
  } catch (erro) {
    console.error("Erro ao apagar contato:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};