// src/controladores/sugestao.controlador.js

// --- LÓGICA PARA O UTILIZADOR ---

exports.criarSugestao = async (req, res, conexao) => {
  const { SugestaoMusica } = conexao.models;
  const { musica_id } = req.params;
  const { campo_sugerido, valor_sugerido } = req.body;
  const usuarioId = req.usuario.id;

  if (!campo_sugerido || !valor_sugerido) {
    return res
      .status(400)
      .json({ mensagem: "O campo e o valor da sugestão são obrigatórios." });
  }

  try {
    const novaSugestao = await SugestaoMusica.create({
      musica_id: parseInt(musica_id, 10), // Garante que o ID é um número
      usuario_id: usuarioId,
      campo_sugerido,
      valor_sugerido,
      status: "pendente",
    });
    return res.status(201).json(novaSugestao);
  } catch (erro) {
    console.error("Erro ao criar sugestão:", erro);
    return res.status(500).json({ mensagem: "Erro ao enviar a sua sugestão." });
  }
};

// --- LÓGICA PARA O PAINEL DE ADMINISTRAÇÃO ---

exports.listarSugestoesPendentes = async (req, res, conexao) => {
  const { SugestaoMusica, Musica, Usuario } = conexao.models;
  try {
    const sugestoes = await SugestaoMusica.findAll({
      where: { status: "pendente" },
      include: [
        { model: Musica, as: "musica", attributes: ["nome", "artista"] },
        { model: Usuario, as: "autor", attributes: ["nome", "email"] },
      ],
      order: [["created_at", "ASC"]],
    });
    return res.status(200).json(sugestoes);
  } catch (erro) {
    console.error("Erro ao listar sugestões:", erro);
    return res
      .status(500)
      .json({ mensagem: "Erro ao buscar sugestões pendentes." });
  }
};

// --- FUNÇÃO DE APROVAÇÃO CORRIGIDA ---
exports.aprovarSugestao = async (req, res, conexao) => {
  const { SugestaoMusica, Musica } = conexao.models;
  const { id } = req.params;
  const t = await conexao.transaction();

  try {
    const sugestao = await SugestaoMusica.findByPk(id, { transaction: t });
    if (!sugestao || sugestao.status !== "pendente") {
      await t.rollback();
      return res
        .status(404)
        .json({ mensagem: "Sugestão não encontrada ou já processada." });
    }

    // Prepara o objeto de atualização
    const dadosParaAtualizar = {
      [sugestao.campo_sugerido]: sugestao.valor_sugerido,
    };

    // Converte para número se o campo for numérico para evitar erros de tipo
    if (
      sugestao.campo_sugerido === "bpm" ||
      sugestao.campo_sugerido === "duracao_segundos"
    ) {
      const valorNumerico = parseInt(sugestao.valor_sugerido, 10);
      if (!isNaN(valorNumerico)) {
        dadosParaAtualizar[sugestao.campo_sugerido] = valorNumerico;
      }
    }

    // PASSO 1 (QUE FALTAVA): Atualiza a música principal com os dados da sugestão
    await Musica.update(dadosParaAtualizar, {
      where: { id: sugestao.musica_id },
      transaction: t,
    });

    // PASSO 2: Atualiza o status da sugestão
    await sugestao.update({ status: "aprovada" }, { transaction: t });

    await t.commit();
    return res
      .status(200)
      .json({ mensagem: "Sugestão aprovada e música atualizada com sucesso!" });
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao aprovar sugestão:", erro);
    return res.status(500).json({ mensagem: "Erro ao processar a aprovação." });
  }
};

exports.rejeitarSugestao = async (req, res, conexao) => {
  const { SugestaoMusica } = conexao.models;
  const { id } = req.params;
  try {
    const [updated] = await SugestaoMusica.update(
      { status: "rejeitada" },
      { where: { id, status: "pendente" } }
    );

    if (updated) {
      return res
        .status(200)
        .json({ mensagem: "Sugestão rejeitada com sucesso." });
    }
    return res
      .status(404)
      .json({ mensagem: "Sugestão não encontrada ou já processada." });
  } catch (erro) {
    console.error("Erro ao rejeitar sugestão:", erro);
    return res.status(500).json({ mensagem: "Erro ao processar a rejeição." });
  }
};
