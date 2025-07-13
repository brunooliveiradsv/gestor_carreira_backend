// src/controladores/financeiro.controlador.js
const { Op, fn, col, literal } = require("sequelize"); // <<< IMPORTANTE: Adicione esta linha
const conquistaServico = require("../servicos/conquista.servico");

exports.listarTransacoes = async (req, res, conexao) => {
  const { Transacao } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const transacoes = await Transacao.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "DESC"]],
    });
    return res.status(200).json(transacoes);
  } catch (erro) {
    console.error("Erro ao listar transações:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.criarTransacao = async (req, res, conexao) => {
  const { Transacao } = conexao.models;
  const { descricao, valor, tipo, data, categoria, compromisso_id } = req.body;
  const usuarioId = req.usuario.id;

  if (!descricao || !valor || !tipo || !data) {
    return res.status(400).json({ mensagem: "Todos os campos (descrição, valor, tipo, data) são obrigatórios." });
  }

  try {
    const novaTransacao = await Transacao.create({
      descricao,
      valor,
      tipo,
      data,
      categoria,
      compromisso_id: compromisso_id || null,
      usuario_id: usuarioId,
    });

    if (tipo === "despesa" && categoria === "Equipamento") {
      conquistaServico.verificarEConcederConquistas(usuarioId, "PRIMEIRA_DESPESA_EQUIPAMENTO", conexao);
    }

    if (tipo === "receita" && compromisso_id) {
      conquistaServico.verificarEConcederConquistas(usuarioId, "PRIMEIRA_RECEITA_SHOW", conexao);
    }

    return res.status(201).json(novaTransacao);
  } catch (erro) {
    console.error("Erro ao criar transação manual:", erro);
    return res.status(400).json({ mensagem: "Erro ao criar transação." });
  }
};

// --- NOVA FUNÇÃO PARA O DASHBOARD ---
exports.resumoMensal = async (req, res, conexao) => {
  const { Transacao } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const agora = new Date();
    const primeiroDiaDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ultimoDiaDoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

    const resumo = await Transacao.findOne({
      attributes: [
        [fn('SUM', literal("CASE WHEN tipo = 'receita' THEN valor ELSE 0 END")), 'totalReceitas'],
        [fn('SUM', literal("CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END")), 'totalDespesas']
      ],
      where: {
        usuario_id: usuarioId,
        data: {
          [Op.between]: [primeiroDiaDoMes, ultimoDiaDoMes]
        }
      },
      raw: true // Retorna um objeto JSON puro
    });

    const totalReceitas = parseFloat(resumo.totalReceitas) || 0;
    const totalDespesas = parseFloat(resumo.totalDespesas) || 0;
    const saldo = totalReceitas - totalDespesas;

    return res.status(200).json({
      totalReceitas,
      totalDespesas,
      saldo
    });

  } catch (erro) {
    console.error("Erro ao calcular resumo mensal:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};