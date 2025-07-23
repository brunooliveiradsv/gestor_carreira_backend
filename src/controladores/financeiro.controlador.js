// src/controladores/financeiro.controlador.js
const { Op, fn, col, literal } = require("sequelize");
const conquistaServico = require("../servicos/conquista.servico");

exports.listarTransacoes = async (req, res, conexao, next) => {
  const { Transacao } = conexao.models;
  const usuarioId = req.usuario.id;
  try {
    const transacoes = await Transacao.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "DESC"]],
    });
    return res.status(200).json(transacoes);
  } catch (erro) {
    next(erro);
  }
};

exports.criarTransacao = async (req, res, conexao, next) => {
  const { Transacao } = conexao.models;
  const { descricao, valor, tipo, data, categoria, compromisso_id } = req.body;
  const usuarioId = req.usuario.id;

  if (!descricao || !valor || !tipo || !data) {
    return res.status(400).json({ mensagem: "Todos os campos (descrição, valor, tipo, data) são obrigatórios." });
  }

  try {
    const novaTransacao = await Transacao.create({
      descricao, valor, tipo, data, categoria,
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
    next(erro);
  }
};

exports.resumoMensal = async (req, res, conexao, next) => {
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
        data: { [Op.between]: [primeiroDiaDoMes, ultimoDiaDoMes] }
      },
      raw: true
    });

    const totalReceitas = parseFloat(resumo.totalReceitas) || 0;
    const totalDespesas = parseFloat(resumo.totalDespesas) || 0;
    const saldo = totalReceitas - totalDespesas;

    return res.status(200).json({ totalReceitas, totalDespesas, saldo });
  } catch (erro) {
    next(erro);
  }
};

// --- NOVA FUNÇÃO PARA O GRÁFICO DO DASHBOARD ---
exports.balancoUltimosMeses = async (req, res, conexao, next) => {
    const { Transacao } = conexao.models;
    const usuarioId = req.usuario.id;

    try {
        const hoje = new Date();
        // Define o início de 6 meses atrás (incluindo o mês atual)
        const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);

        const resultados = await Transacao.findAll({
            attributes: [
                // Extrai o ano e o mês da data
                [fn('EXTRACT', literal('YEAR FROM data')), 'ano'],
                [fn('EXTRACT', literal('MONTH FROM data')), 'mes'],
                // Soma as receitas e despesas separadamente
                [fn('SUM', literal("CASE WHEN tipo = 'receita' THEN valor ELSE 0 END")), 'total_receitas'],
                [fn('SUM', literal("CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END")), 'total_despesas']
            ],
            where: {
                usuario_id: usuarioId,
                data: { [Op.gte]: dataInicio }
            },
            // Agrupa os resultados por ano e mês
            group: ['ano', 'mes'],
            order: [['ano', 'ASC'], ['mes', 'ASC']],
            raw: true
        });

        // Formata os dados para o frontend
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const dadosFormatados = resultados.map(item => ({
            mes: `${meses[item.mes - 1]}/${String(item.ano).slice(-2)}`,
            receitas: parseFloat(item.total_receitas) || 0,
            despesas: parseFloat(item.total_despesas) || 0
        }));

        return res.status(200).json(dadosFormatados);
    } catch (erro) {
        next(erro);
    }
};