// src/controladores/sugestao.controlador.js

exports.criarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica } = conexao.models;
    const { musica_id } = req.params;
    const { campo_sugerido, valor_sugerido } = req.body;
    const usuarioId = req.usuario.id;

    if (!campo_sugerido || !valor_sugerido) {
        return res.status(400).json({ mensagem: "O campo e o valor da sugestão são obrigatórios." });
    }

    try {
        const novaSugestao = await SugestaoMusica.create({
            musica_id: parseInt(musica_id, 10), // Garante que o ID é um número
            usuario_id: usuarioId,
            campo_sugerido,
            valor_sugerido,
            status: 'pendente'
        });
        return res.status(201).json(novaSugestao);
    } catch (erro) {
        console.error("Erro ao criar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao enviar a sua sugestão." });
    }
};

/**
 * Lista todas as sugestões com o status 'pendente' para o painel de administração.
 */
exports.listarSugestoesPendentes = async (req, res, conexao) => {
    const { SugestaoMusica, Musica, Usuario } = conexao.models;
    try {
        const sugestoes = await SugestaoMusica.findAll({
            where: { status: 'pendente' },
            include: [
                { model: Musica, as: 'musica', attributes: ['nome', 'artista'] },
                { model: Usuario, as: 'autor', attributes: ['nome', 'email'] }
            ],
            order: [['created_at', 'ASC']]
        });
        return res.status(200).json(sugestoes);
    } catch (erro) {
        console.error("Erro ao listar sugestões pendentes:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar sugestões pendentes." });
    }
};

/**
 * Aprova uma sugestão, atualizando a música original e o status da sugestão.
 */
exports.aprovarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica, Musica } = conexao.models;
    const { id } = req.params;
    const t = await conexao.transaction();

    try {
        const sugestao = await SugestaoMusica.findByPk(id, { transaction: t });

        if (!sugestao || sugestao.status !== 'pendente') {
            await t.rollback();
            return res.status(404).json({ mensagem: "Sugestão não encontrada ou já processada." });
        }

        const dadosParaAtualizar = {};
        const campo = sugestao.campo_sugerido;
        let valor = sugestao.valor_sugerido;

        // Converte para número se o campo for numérico para evitar erros de tipo
        if (campo === 'bpm' || campo === 'duracao_segundos') {
            const valorNumerico = parseInt(valor, 10);
            // Só atualiza se for um número válido
            if (!isNaN(valorNumerico)) {
                valor = valorNumerico;
            } else {
                // Se o valor não for um número válido, não o incluímos na atualização
                console.warn(`Valor inválido para o campo numérico '${campo}': ${valor}`);
                valor = undefined; // Ignora este campo na atualização
            }
        }
        
        // Apenas adiciona ao objeto de atualização se o valor for válido
        if (valor !== undefined) {
             dadosParaAtualizar[campo] = valor;
        }

        // Garante que só atualizamos se houver algo para atualizar
        if (Object.keys(dadosParaAtualizar).length > 0) {
            // PASSO 1: Atualiza a música principal com os dados da sugestão
            await Musica.update(
                dadosParaAtualizar,
                { where: { id: sugestao.musica_id }, transaction: t }
            );
        }

        // PASSO 2: Atualiza o status da sugestão
        await sugestao.update({ status: 'aprovada' }, { transaction: t });

        await t.commit();
        return res.status(200).json({ mensagem: "Sugestão aprovada e música atualizada com sucesso!" });

    } catch (erro) {
        await t.rollback();
        console.error("Erro ao aprovar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao processar a aprovação." });
    }
};

/**
 * Rejeita uma sugestão, alterando o seu status.
 */
exports.rejeitarSugestao = async (req, res, conexao) => {
    const { SugestaoMusica } = conexao.models;
    const { id } = req.params;
    try {
        const [updated] = await SugestaoMusica.update(
            { status: 'rejeitada' },
            { where: { id, status: 'pendente' } }
        );

        if (updated) {
            return res.status(200).json({ mensagem: "Sugestão rejeitada com sucesso." });
        }
        return res.status(404).json({ mensagem: "Sugestão não encontrada ou já processada." });

    } catch (erro) {
        console.error("Erro ao rejeitar sugestão:", erro);
        return res.status(500).json({ mensagem: "Erro ao processar a rejeição." });
    }
};