// src/servicos/interacao.servico.js
const PONTOS = {
    APLAUSO: 5,
    LIKE_MUSICA: 2,
    VOTO_ENQUETE: 1,
};

exports.registrarInteracao = async (faId, artistaId, tipo, conexao, entidadeId = null) => {
    const { Interacao } = conexao.models;
    await Interacao.create({
        fa_id: faId,
        artista_id: artistaId,
        tipo: tipo,
        entidade_id: entidadeId,
        pontos: PONTOS[tipo] || 1,
    });
};