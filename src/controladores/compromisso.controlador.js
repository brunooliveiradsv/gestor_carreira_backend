// src/controladores/compromisso.controlador.js
const conquistaServico = require("../servicos/conquista.servico.js");
const compromissoServico = require("../servicos/compromisso.servico.js");

exports.criar = async (req, res, conexao) => {
  const { Compromisso } = conexao.models;
  const {
    tipo,
    nome_evento,
    data,
    local,
    status,
    valor_cache,
    despesas,
    repertorio_id,
  } = req.body;
  const usuarioId = req.usuario.id;

  // Trata o valor_cache para garantir que seja nulo se estiver vazio
  const cacheParaSalvar =
    valor_cache === "" || valor_cache === null ? null : valor_cache;

  try {
    const novoCompromisso = await Compromisso.create({
      tipo,
      nome_evento,
      data,
      local,
      status: "Agendado",
      valor_cache: cacheParaSalvar,
      despesas,
      repertorio_id,
      usuario_id: usuarioId,
    });

    conquistaServico.verificarEConcederConquistas(
      usuarioId,
      "PRIMEIRO_COMPROMISSO_CRIADO",
      conexao
    );

    // Lógica inteligente para verificar se o compromisso foi criado no passado
    if (new Date(novoCompromisso.data) < new Date()) {
      console.log(
        `Compromisso ${novoCompromisso.id} criado no passado. Processando como 'Realizado'.`
      );
      await novoCompromisso.update({ status: "Realizado" });
      await compromissoServico.processarCompromissoRealizado(
        novoCompromisso,
        conexao
      );
      await novoCompromisso.reload();
    }

    return res.status(201).json(novoCompromisso);
  } catch (erro) {
    console.error("Erro ao criar compromisso:", erro);
    res
      .status(400)
      .json({ mensagem: "Erro ao criar compromisso.", detalhes: erro.message });
  }
};

exports.listar = async (req, res, conexao) => {
  const { Compromisso } = conexao.models;
  const usuarioId = req.usuario.id;

  try {
    const compromissos = await Compromisso.findAll({
      where: { usuario_id: usuarioId },
      order: [["data", "DESC"]], // <--- Confirme que está escrito 'DESC' aqui
    });
    return res.status(200).json(compromissos);
  } catch (erro) {
    console.error("Erro ao listar compromissos:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
  const { Compromisso } = conexao.models;
  const idDoCompromisso = parseInt(req.params.id, 10);
  const usuarioId = req.usuario.id;

  if (isNaN(idDoCompromisso)) {
    return res.status(400).json({ mensagem: "Formato de ID inválido." });
  }

  try {
    const compromisso = await Compromisso.findOne({
      where: { id: idDoCompromisso, usuario_id: usuarioId },
    });

    if (!compromisso) {
      return res.status(404).json({ mensagem: "Compromisso não encontrado." });
    }

    return res.status(200).json(compromisso);
  } catch (erro) {
    console.error("Erro ao buscar compromisso:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro no servidor." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Compromisso } = conexao.models;
  const idDoCompromisso = parseInt(req.params.id, 10);
  const usuarioId = req.usuario.id;
  const novosDados = req.body;

  if (novosDados.valor_cache === '' || novosDados.valor_cache === null) {
    novosDados.valor_cache = null;
  }

  try {
    const compromisso = await Compromisso.findOne({ where: { id: idDoCompromisso, usuario_id: usuarioId }});
    if (!compromisso) {
      return res.status(404).json({ mensagem: "Compromisso não encontrado ou não pertence ao usuário." });
    }
    
    // 1. Aplica as novas atualizações enviadas pelo formulário
    await compromisso.update(novosDados);

    // 2. Lógica de Automação
    const dataAtualizada = new Date(compromisso.data);
    const agora = new Date();
    
    // O gatilho agora roda se:
    // a) O status foi explicitamente mudado para 'Realizado'
    // b) OU se a data do evento agora está no passado e o status ainda era 'Agendado'
    if (novosDados.status === 'Realizado' || (dataAtualizada < agora && compromisso.status === 'Agendado')) {
      
      // Se entrou aqui por causa da data, força a mudança de status antes de processar
      if (compromisso.status === 'Agendado') {
        await compromisso.update({ status: 'Realizado' });
        console.log(`Compromisso ID ${compromisso.id} atualizado para 'Realizado' por ter data no passado.`);
      }
      
      compromissoServico.processarCompromissoRealizado(compromisso, conexao);
    }

    // Recarrega os dados do banco para garantir que a resposta tenha os dados mais recentes
    await compromisso.reload();

    return res.status(200).json(compromisso);
  } catch (erro) {
    console.error("Erro ao atualizar compromisso:", erro);
    res.status(400).json({ mensagem: "Erro ao atualizar compromisso.", detalhes: erro.message });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Compromisso } = conexao.models;
  const idDoCompromisso = parseInt(req.params.id, 10);
  const usuarioId = req.usuario.id;

  try {
    const compromisso = await Compromisso.findOne({
      where: { id: idDoCompromisso, usuario_id: usuarioId },
    });
    if (!compromisso) {
      return res
        .status(404)
        .json({
          mensagem: "Compromisso não encontrado ou não pertence ao usuário.",
        });
    }
    await compromisso.destroy();
    return res.status(204).send();
  } catch (erro) {
    console.error("Erro ao apagar compromisso:", erro);
    res
      .status(400)
      .json({
        mensagem: "Erro ao apagar compromisso.",
        detalhes: erro.message,
      });
  }
};
