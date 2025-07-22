// src/controladores/equipamento.controlador.js
const conquistaServico = require("../servicos/conquista.servico");

// A assinatura de todas as funções agora inclui 'next'
exports.criar = async (req, res, next) => {
  const { Equipamento, Transacao } = conexao.models;
  const { nome, marca, modelo, tipo, notas, valor_compra, data_compra, gerar_despesa } = req.body;
  const usuarioId = req.usuario.id;

  const cacheParaSalvar = (valor_compra === '' || valor_compra === null) ? null : valor_compra;
  const t = await conexao.transaction();

  try {
    const novoEquipamento = await Equipamento.create({
      nome, marca, modelo, tipo, notas, 
      valor_compra: cacheParaSalvar,
      data_compra, 
      usuario_id: usuarioId,
    }, { transaction: t });

    if (gerar_despesa && cacheParaSalvar && parseFloat(cacheParaSalvar) > 0) {
      await Transacao.create({
        usuario_id: usuarioId,
        descricao: `Compra de equipamento: ${nome}`,
        valor: cacheParaSalvar,
        tipo: 'despesa',
        categoria: 'Equipamento',
        data: data_compra || new Date(),
      }, { transaction: t });
      conquistaServico.verificarEConcederConquistas(usuarioId, 'PRIMEIRA_DESPESA_EQUIPAMENTO', conexao);
    }
    
    await t.commit();
    return res.status(201).json(novoEquipamento);

  } catch (erro) {
    await t.rollback();
    next(erro); // <-- ALTERADO AQUI
  }
};


exports.listar = async (req, res, next) => {
  const { Equipamento } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const equipamentos = await Equipamento.findAll({
      where: { usuario_id: usuarioId },
      order: [["nome", "ASC"]],
    });
    return res.status(200).json(equipamentos);
  } catch (erro) {
    next(erro); // <-- ALTERADO AQUI
  }
};

exports.buscarPorId = async (req, res, next) => {
  const { Equipamento } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const equipamento = await Equipamento.findOne({
      where: { id, usuario_id: usuarioId },
    });
    if (!equipamento) {
      return res.status(404).json({ mensagem: "Equipamento não encontrado." });
    }
    return res.status(200).json(equipamento);
  } catch (erro) {
    next(erro); // <-- ALTERADO AQUI
  }
};

exports.atualizar = async (req, res, next) => {
  const { Equipamento } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const [updated] = await Equipamento.update(req.body, {
      where: { id, usuario_id: usuarioId },
    });
    if (updated) {
      const equipamentoAtualizado = await Equipamento.findByPk(id);
      return res.status(200).json(equipamentoAtualizado);
    }
    return res.status(404).json({ mensagem: "Equipamento não encontrado." });
  } catch (erro) {
    next(erro); // <-- ALTERADO AQUI
  }
};

exports.apagar = async (req, res, next) => {
  const { Equipamento } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  try {
    const deletado = await Equipamento.destroy({
      where: { id, usuario_id: usuarioId },
    });
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Equipamento não encontrado." });
  } catch (erro) {
    next(erro); // <-- ALTERADO AQUI
  }
};