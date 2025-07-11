// src/controladores/financeiro.controlador.js
const conquistaServico = require("../servicos/conquista.servico"); // Importa o serviço de conquistas

// Função para LISTAR todas as transações do usuário
exports.listarTransacoes = async (req, res, conexao) => {
  const { Transacao, Conquista } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const transacoes = await Transacao.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "DESC"]],
      // Inclui a associação com compromisso, se necessário no futuro
    });
    return res.status(200).json(transacoes);
  } catch (erro) {
    console.error("Erro ao listar transações:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

// Função para CRIAR uma nova transação manual
exports.criarTransacao = async (req, res, conexao) => {
  const { Transacao } = conexao.models;
  // CORREÇÃO: Adicionamos 'categoria' à lista de dados lidos do corpo
  const { descricao, valor, tipo, data, categoria } = req.body;
  const usuarioId = req.usuario.id;

  if (!descricao || !valor || !tipo || !data) {
    return res
      .status(400)
      .json({
        mensagem:
          "Todos os campos (descrição, valor, tipo, data) são obrigatórios.",
      });
  }

  try {
    const novaTransacao = await Transacao.create({
      descricao,
      valor,
      tipo,
      data,
      categoria, // Salva a categoria no banco de dados
      usuario_id: usuarioId,
    });

    // --- GATILHO CORRIGIDO ---
    // Após criar a transação, verifica se a condição da conquista foi atendida
    if (tipo === "despesa" && categoria === "Equipamento") {
      conquistaServico.verificarEConcederConquistas(
        usuarioId,
        "PRIMEIRA_DESPESA_EQUIPAMENTO",
        conexao
      );
    }

    return res.status(201).json(novaTransacao);
  } catch (erro) {
    console.error("Erro ao criar transação manual:", erro);
    return res.status(400).json({ mensagem: "Erro ao criar transação." });
  }
};
