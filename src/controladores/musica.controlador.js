// src/controladores/musica.controlador.js
const { Op } = require('sequelize');

exports.criar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { nome, artista, tom, duracao_segundos, link_cifra, notas_adicionais, tags } = req.body;
  const usuarioId = req.usuario.id;
  const axios = require('axios');
  const cheerio = require('cheerio');

  if (!nome || !artista) {
    return res.status(400).json({ mensagem: "Nome da música e artista são obrigatórios." });
  }

  const t = await conexao.transaction();
  try {
    const novaMusica = await Musica.create({
      nome, artista, tom, duracao_segundos, link_cifra, notas_adicionais,
      usuario_id: usuarioId
    }, { transaction: t });

    if (tags && tags.length > 0) {
      const tagsParaAssociar = [];
      for (const nomeTag of tags) {
        const [tag] = await Tag.findOrCreate({
          where: { nome: nomeTag.trim(), usuario_id: usuarioId },
          transaction: t
        });
        tagsParaAssociar.push(tag);
      }
      await novaMusica.setTags(tagsParaAssociar, { transaction: t });
    }
    
    await t.commit();
    const musicaCompleta = await Musica.findByPk(novaMusica.id, { include: 'tags' });
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

  // Constrói a cláusula 'where' dinamicamente
  const whereClause = { usuario_id: usuarioId };
  if (termoBusca) {
    whereClause[Op.or] = [
      { nome: { [Op.iLike]: `%${termoBusca}%` } },
      { artista: { [Op.iLike]: `%${termoBusca}%` } }
    ];
  }
  if (tom) {
    whereClause.tom = tom;
  }
  if (semTocarDesde) {
    whereClause[Op.or] = [
        { ultima_vez_tocada: { [Op.is]: null } },
        { ultima_vez_tocada: { [Op.lt]: new Date(semTocarDesde) } }
    ];
  }

  // Constrói a cláusula 'order'
  const orderClause = [];
  if (popularidade === 'desc') {
    orderClause.push(['popularidade', 'DESC']);
  }
  orderClause.push(['nome', 'ASC']); // Ordem alfabética como padrão

  try {
    const musicas = await Musica.findAll({
      where: whereClause,
      include: [{
        model: Tag,
        as: 'tags',
        attributes: ['id', 'nome'],
        // Se houver filtro de tags, aplica-o aqui
        ...(tags && { where: { id: { [Op.in]: tags.split(',') } } }),
        through: { attributes: [] }
      }],
      order: orderClause
    });

    return res.status(200).json(musicas);
  } catch (erro) {
    console.error("Erro ao listar músicas:", erro);
    return res.status(500).json({ mensagem: "Erro ao listar as músicas." });
  }
};

exports.atualizar = async (req, res, conexao) => {
  const { Musica, Tag } = conexao.models;
  const { id } = req.params;
  const usuarioId = req.usuario.id;
  const { tags, ...dadosMusica } = req.body;
  const t = await conexao.transaction();

  try {
    const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId }, transaction: t });
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
          transaction: t
        });
        tagsParaAssociar.push(tag);
      }
      await musica.setTags(tagsParaAssociar, { transaction: t });
    }

    await t.commit();
    const musicaAtualizada = await Musica.findByPk(id, { include: 'tags' });
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
    const deletado = await Musica.destroy({ where: { id, usuario_id: usuarioId } });
    if (deletado) {
      return res.status(204).send();
    }
    return res.status(404).json({ mensagem: "Música não encontrada." });
  } catch (erro) {
    return res.status(500).json({ mensagem: "Erro ao apagar música." });
  }
};

exports.buscarPorId = async (req, res, conexao) => {
    const { Musica, Tag } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    try {
        const musica = await Musica.findOne({
            where: { id, usuario_id: usuarioId },
            include: [{ model: Tag, as: 'tags' }]
        });

        if (!musica) {
            return res.status(404).json({ mensagem: "Música não encontrada." });
        }
        return res.status(200).json(musica);
    } catch (erro) {
        return res.status(500).json({ mensagem: "Erro ao buscar a música." });
    }
};


exports.tocarMusica = async (req, res, conexao) => {
    const { Musica } = conexao.models;
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    try {
        const musica = await Musica.findOne({ where: { id, usuario_id: usuarioId } });
        if (!musica) {
            return res.status(404).json({ mensagem: "Música não encontrada." });
        }
        
        // Atualiza a data e incrementa a popularidade
        await musica.update({
            ultima_vez_tocada: new Date(),
            popularidade: musica.popularidade + 1
        });
        
        return res.status(200).json(musica);

    } catch(erro) {
        console.error("Erro ao registrar 'tocar música':", erro);
        return res.status(500).json({ mensagem: "Erro ao registrar a ação." });
    }
}

exports.rasparCifra = async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('cifraclub.com.br')) {
    return res.status(400).json({ mensagem: "URL do Cifra Club inválida ou não fornecida." });
  }

  try {
    // 1. Baixa o HTML da página
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // 2. Extrai as informações usando seletores de CSS
    //    (Estes seletores podem precisar de ser ajustados se o Cifra Club mudar o seu site)
    const nome = $('h1.t1').text().trim();
    const artista = $('h2.t3').text().trim();
    const tom = $('#cifra_tom').text().trim();
    const cifra = $('pre#cifra_tab').html(); // Usamos .html() para manter as tags <b>

    if (!nome || !artista || !cifra) {
      return res.status(404).json({ mensagem: "Não foi possível encontrar os dados da cifra na página. O layout do site pode ter mudado." });
    }

    // 3. Devolve os dados extraídos
    return res.status(200).json({
      nome,
      artista,
      tom,
      notas_adicionais: cifra ? cifra.replace(/<b>/g, '').replace(/<\/b>/g, '') : '', // Remove as tags <b>
    });

  } catch (erro) {
    console.error("Erro ao fazer scraping do Cifra Club:", erro);
    return res.status(500).json({ mensagem: "Ocorreu um erro ao tentar obter os dados do Cifra Club." });
  }
};