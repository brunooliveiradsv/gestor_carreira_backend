// src/controladores/repertorio.controlador.js
const conquistaServico = require('../servicos/conquista.servico');

exports.criar = async (req, res, conexao) => {
  const { Repertorio } = conexao.models;
  const { nome, link_cifraclub, notas_adicionais } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const novoRepertorio = await Repertorio.create({
      nome, link_cifraclub, notas_adicionais, usuario_id: usuarioId
    });
    // Gatilho para conquistas de repertório
    conquistaServico.verificarEConcederConquistas(usuarioId, 'CONTAGEM_REPERTORIOS', conexao);
    conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRO_REPERTORIO_CRIADO', conexao);
    return res.status(201).json(novoRepertorio);
  } catch (erro) {
    return res.status(400).json({ mensagem: "Erro ao criar repertório." });
  }
};

exports.listar = async (req, res, conexao) => {
  const { Repertorio } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const repertorios = await Repertorio.findAll({
      where: { usuario_id: usuarioId },
      order: [['nome', 'ASC']]
    });
    return res.status(200).json(repertorios);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
  const { Repertorio } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const repertorio = await Repertorio.findOne({ where: { id, usuario_id: usuarioId } });
    if (!repertorio) return res.status(404).json({ mensagem: "Repertório não encontrado." });
    return res.status(200).json(repertorio);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Repertorio } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const [updated] = await Repertorio.update(req.body, { where: { id, usuario_id: usuarioId } });
    if (updated) {
      const repertorioAtualizado = await Repertorio.findByPk(id);
      return res.status(200).json(repertorioAtualizado);
    }
    return res.status(404).json({ mensagem: "Repertório não encontrado." });
  } catch (erro) {
    return res.status(400).json({ mensagem: "Erro ao atualizar repertório." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Repertorio } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Repertorio.destroy({ where: { id, usuario_id: usuarioId } });
    if (deletado) return res.status(204).send();
    return res.status(404).json({ mensagem: "Repertório não encontrado." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};