// src/controladores/musica.controlador.js
const { Op } = require("sequelize");
const axios = require("axios");
const cheerio = require("cheerio");

// ... (as outras funções como criar, listar, etc., permanecem exatamente iguais)
exports.criar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  let {
    nome,
    artista,
    tom,
    duracao_segundos,
    link_cifra,
    notas_adicionais,
    tags,
  } = req.body;
  const usuarioId = req.usuario.id;

  if (!nome || !artista) {
    return res
      .status(400)
      .json({ mensagem: "Nome da música e artista são obrigatórios." });
  }

  const duracaoParaSalvar = duracao_segundos
    ? parseInt(duracao_segundos, 10)
    : null;
  if (isNaN(duracaoParaSalvar)) {
    duracao_segundos = null;
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create(
      {
        nome,
        artista,
        tom,
        duracao_segundos: duracaoParaSalvar,
        link_cifra,
        notas_adicionais,
        usuario_id: usuarioId,
      },
      { transaction: t }
    );

    if (tags && tags.length > 0) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t,
        });
        tagsParaAssociar.push(tag);
      }
      await novaMusica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaCompleta = await Musica.findByPk(novaMusica.id, {
      include: "tags",
    });
    return res.status(201).json(musicaCompleta);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao criar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao criar a música." });
  }
};

exports.listar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const usuarioId = req.usuario.id;
  const { termoBusca, tom, tags, semTocarDesde, popularidade } = req.query;

  const whereClause = { usuario_id: usuarioId };
  if (termoBusca) {
    whereClause[Op.or] = [
      { nome: { [Op.iLike]: `%${termoBusca}%` } },
      { artista: { [Op.iLike]: `%${termoBusca}%` } },
    ];
  }
  if (tom) {
    whereClause.tom = tom;
  }
  if (semTocarDesde) {
    whereClause[Op.or] = [
      { ultima_vez_tocada: { [Op.is]: null } },
      { ultima_vez_tocada: { [Op.lt]: new Date(semTocarDesde) } },
    ];
  }

  const orderClause = [];
  if (popularidade === "desc") {
    orderClause.push(["popularidade", "DESC"]);
  }
  orderClause.push(["nome", "ASC"]);

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: [
        {
          model: Tag,
          as: "tags",
          attributes: ["id", "nome"],
          ...(tags && { where: { id: { [Op.in]: tags.split(",") } } }),
          through: { attributes: [] },
        },
      ],
      order: orderClause,
    });

    return res.status(200).json(musicas);
  } catch (erro) {
    console.error("Erro ao listar músicas:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar as músicas." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
      include: [{ model: Tag, as: "tags" }],
    });

    if (!musica) {
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }
    return res.status(200).json(musica);
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao buscar a música." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  const { tags, ...dadosMusica } = req.body;
  const t = await conexao.transaction();

  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
      transaction: t,
    });
    if (!musica) {
      await t.rollback();
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

    await musica.update(dadosMusica, { transaction: t });

    if (tags && Array.isArray(tags)) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t,
        });
        tagsParaAssociar.push(tag);
      }
      await musica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaAtualizada = await Musica.findByPk(id, { include: "tags" });
    return res.status(200).json(musicaAtualizada);
  } catch (erro) {
    await t.rollback();
    console.error("Erro ao atualizar música:", erro);
    return res.status(500).json({ mensagem: "Erro ao atualizar a música." });
  }
};

exports.apagar = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const deletado = await Musica.destroy({
      where: { id, usuario_id: usuarioId },
    });
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Música não encontrada." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao apagar música." });
  }
};

exports.tocarMusica = async (req, res, conexao) => {
  const { Musica } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const musica = await Musica.findOne({
      where: { id, usuario_id: usuarioId },
    });
    if (!musica) {
      return res.status(404).json({ mensagem: "Música não encontrada." });
    }

    await musica.update({
      ultima_vez_tocada: new Date(),
      popularidade: musica.popularidade + 1,
    });

    return res.status(200).json(musica);
  } catch (erro) {
    console.error("Erro ao registrar 'tocar música':", erro);
    return res.status(500).json({ mensagem: "Erro ao registrar a ação." });
  }
};

// --- FUNÇÃO BUSCAINTELIGENTE MAIS ROBUSTA ---
exports.buscaInteligente = async (req, res) => {
  const { nomeMusica, nomeArtista } = req.body;
  if (!nomeMusica || !nomeArtista) {
    return res
      .status(400)
      .json({ mensagem: "Nome da música e do artista são necessários." });
  }

  try {
    console.log(
      `[Detetive Musical] Iniciando busca para: ${nomeMusica} - ${nomeArtista}`
    );

    // --- PARTE 1: BUSCAR A CIFRA NO CIFRA CLUB ---
    const termoBuscaCifra = encodeURIComponent(`${nomeMusica} ${nomeArtista}`);
    const urlBuscaCifra = `https://www.cifraclub.com.br/search/?q=${termoBuscaCifra}`;

    let dadosCifra = {};

    try {
      const { data: dataBuscaCifra } = await axios.get(urlBuscaCifra);
      const $buscaCifra = cheerio.load(dataBuscaCifra);
      const linkCifra = $buscaCifra(".gsc-webResult.gsc-result a.gs-title")
        .first()
        .attr("href");

      if (linkCifra) {
        console.log(`[Detetive Musical] Cifra encontrada em: ${linkCifra}`);
        const { data: dataPaginaCifra } = await axios.get(linkCifra);
        const $paginaCifra = cheerio.load(dataPaginaCifra);
        const cifraHtml = $paginaCifra("pre").html();
        if (cifraHtml) {
          const cifraComQuebrasDeLinha = cifraHtml.replace(
            /<br\s*\/?>/gi,
            "\n"
          );
          const $temp = cheerio.load(cifraComQuebrasDeLinha);
          dadosCifra.notas_adicionais = $temp.text();
          dadosCifra.tom = $paginaCifra("#cifra_tom").text().trim();
        }
      }
    } catch (erroCifra) {
      console.error(
        "[Detetive Musical] Erro ao buscar no Cifra Club. Continuando mesmo assim.",
        erroCifra.message
      );
    }

    // --- PARTE 2: BUSCAR DADOS TÉCNICOS NO TUNEBAT ---
    const termoBuscaTecnica = encodeURIComponent(
      `${nomeArtista} ${nomeMusica}`
    );
    const urlBuscaTecnica = `https://tunebat.com/Search?q=${termoBuscaTecnica}`;

    let dadosTecnicos = {};

    try {
      const { data: dataBuscaTecnica } = await axios.get(urlBuscaTecnica);
      const $buscaTecnica = cheerio.load(dataBuscaTecnica);
      // Encontra o primeiro resultado de busca e pega o link
      const linkPaginaMusica = $buscaTecnica(".main-well a.search-track-name")
        .first()
        .attr("href");

      if (linkPaginaMusica) {
        const urlCompletaMusica = `https://tunebat.com${linkPaginaMusica}`;
        console.log(
          `[Detetive Musical] Dados técnicos encontrados em: ${urlCompletaMusica}`
        );

        const { data: dataPaginaMusica } = await axios.get(urlCompletaMusica);
        const $paginaMusica = cheerio.load(dataPaginaMusica);

        // Extrai os dados específicos da página da música
        $paginaMusica(".info-box-value").each(function (i, elem) {
          const valor = $(elem).text().trim();
          const tipo = $(elem).prev(".info-box-key").text().trim();
          if (tipo.includes("Key")) dadosTecnicos.tom_alternativo = valor;
          if (tipo.includes("BPM")) dadosTecnicos.bpm = parseInt(valor, 10);
          if (tipo.includes("Duration")) {
            const partes = valor.split(":");
            if (partes.length === 2) {
              dadosTecnicos.duracao_segundos =
                parseInt(partes[0], 10) * 60 + parseInt(partes[1], 10);
            }
          }
        });
      }
    } catch (erroTecnico) {
      console.error(
        "[Detetive Musical] Erro ao buscar no TuneBat. Continuando mesmo assim.",
        erroTecnico.message
      );
    }

    // --- PARTE 3: CONSOLIDAR E DEVOLVER O RELATÓRIO FINAL ---
    const resultadoFinal = {
      nome: nomeMusica,
      artista: nomeArtista,
      tom: dadosCifra.tom || dadosTecnicos.tom_alternativo || "",
      notas_adicionais: dadosCifra.notas_adicionais || "Cifra não encontrada.",
      bpm: dadosTecnicos.bpm || null,
      duracao_segundos: dadosTecnicos.duracao_segundos || null,
    };

    console.log("[Detetive Musical] Relatório final:", resultadoFinal);
    return res.status(200).json(resultadoFinal);
  } catch (erro) {
    console.error("Erro geral na busca inteligente:", erro);
    return res
      .status(500)
      .json({
        mensagem: "Ocorreu um erro geral ao buscar os dados da música.",
      });
  }
};

// --- NOVA FUNÇÃO DE BUSCA INTERNA ---
exports.buscaInterna = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { nome, artista } = req.query; // Recebe os dados como parâmetros de query

    if (!nome || !artista) {
        return res.status(400).json({ mensagem: "Nome da música e artista são necessários." });
    }

    try {
        const musica = await Musica.findOne({
            where: {
                nome: { [Op.iLike]: nome },
                artista: { [Op.iLike]: artista },
                usuario_id: req.usuario.id
            }
        });

        if (musica) {
            console.log(`[Busca Interna] Música "${nome}" encontrada no banco de dados.`);
            return res.status(200).json(musica);
        } else {
            return res.status(404).json({ mensagem: "Música não encontrada no banco de dados interno." });
        }

    } catch (error) {
        console.error("Erro na busca interna:", error);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
};