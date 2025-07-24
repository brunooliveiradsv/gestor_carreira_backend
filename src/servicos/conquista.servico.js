// src/servicos/conquista.servico.js
const { Op } = require("sequelize");

exports.verificarEConcederConquistas = async (
  usuarioId,
  tipoCondicao,
  conexao
) => {
  const { Conquista, Usuario, Notificacao } = conexao.models;
  try {
    const conquistasParaVerificar = await Conquista.findAll({
      where: { tipo_condicao: tipoCondicao },
    });
    if (conquistasParaVerificar.length === 0) return;

    const usuario = await Usuario.findByPk(usuarioId, {
      include: "conquistas",
    });
    if (!usuario) return;

    const idsConquistasAtuais = usuario.conquistas.map((c) => c.id);
    const valorAtual = await exports.calcularProgressoAtual(
      usuarioId,
      tipoCondicao,
      conexao
    );

    for (const conquista of conquistasParaVerificar) {
      if (idsConquistasAtuais.includes(conquista.id)) continue;

      if (valorAtual >= conquista.valor_condicao) {
        await usuario.addConquista(conquista, {
          through: { data_desbloqueio: new Date() },
        });
        await Notificacao.create({
          usuario_id: usuarioId,
          mensagem: `Parabéns! Você desbloqueou a conquista: "${conquista.nome}"`,
          conquista_id: conquista.id,
        });
        console.log(
          `--- SUCESSO: Conquista e Notificação para "${conquista.nome}" criadas.`
        );
      }
    }
  } catch (erro) {
    console.error(
      `--- FALHA: Erro no serviço de conquistas para o tipo ${tipoCondicao}:`,
      erro
    );
  }
};

exports.calcularProgressoAtual = async (usuarioId, tipoCondicao, conexao) => {
  const { Compromisso, Contato, Transacao, Setlist, Musica, Usuario, SugestaoMusica } = conexao.models;
  let valorAtual = 0;

  switch (tipoCondicao) {
    case "CONTAGEM_SHOWS_REALIZADOS":
      valorAtual = await Compromisso.count({ where: { usuario_id: usuarioId, tipo: "Show", status: "Realizado" } });
      break;
    case "CONTAGEM_ENSAIOS_REALIZADOS":
      valorAtual = await Compromisso.count({ where: { usuario_id: usuarioId, tipo: "Ensaio", status: "Realizado" } });
      break;
    case "CONTAGEM_GRAVACOES_REALIZADAS":
      valorAtual = await Compromisso.count({ where: { usuario_id: usuarioId, tipo: "Gravação", status: "Realizado" } });
      break;
    case "CONTAGEM_CONTATOS":
      valorAtual = await Contato.count({ where: { usuario_id: usuarioId } });
      break;
    case "CONTAGEM_REPERTORIOS":
      valorAtual = await Setlist.count({ where: { usuario_id: usuarioId } });
      break;
    case "PRIMEIRO_REPERTORIO_CRIADO":
      valorAtual = await Setlist.count({ where: { usuario_id: usuarioId } });
      break;
    case "PRIMEIRO_COMPROMISSO_CRIADO":
      valorAtual = await Compromisso.count({ where: { usuario_id: usuarioId } });
      break;
    case "PRIMEIRA_RECEITA_SHOW":
      valorAtual = await Transacao.count({ where: { usuario_id: usuarioId, tipo: "receita", compromisso_id: { [Op.ne]: null } } });
      break;
    case "TOTAL_RECEITAS":
      const total = await Transacao.sum("valor", { where: { usuario_id: usuarioId, tipo: "receita" } });
      valorAtual = total || 0;
      break;
    case "PRIMEIRA_DESPESA_EQUIPAMENTO":
      valorAtual = await Transacao.count({ where: { usuario_id: usuarioId, tipo: "despesa", categoria: "Equipamento" } });
      break;
    
    // --- NOVOS CASOS ADICIONADOS ---
    case "ASSINATURA_ATIVA":
      const userAssinatura = await Usuario.findByPk(usuarioId);
      // Agora, só conta se a assinatura for 'ativa' E o plano for 'padrao' ou 'premium'
      valorAtual = userAssinatura && userAssinatura.status_assinatura === 'ativa' && (userAssinatura.plano === 'padrao' || userAssinatura.plano === 'premium') ? 1 : 0;
      break;
    case "PRIMEIRA_VITRINE_CRIADA":
      const userVitrine = await Usuario.findByPk(usuarioId);
      valorAtual = userVitrine && userVitrine.url_unica ? 1 : 0;
      break;
    case "CONTAGEM_APLAUSOS":
      const userAplausos = await Usuario.findByPk(usuarioId);
      valorAtual = userAplausos ? userAplausos.aplausos : 0;
      break;
    case "CONTAGEM_MUSICAS":
      valorAtual = await Musica.count({ where: { usuario_id: usuarioId } });
      break;
    case "SUGESTAO_APROVADA":
      valorAtual = await SugestaoMusica.count({ where: { usuario_id: usuarioId, status: 'aprovada' } });
      break;

    default:
      console.warn(`Tipo de condição desconhecido para cálculo de progresso: ${tipoCondicao}`);
      valorAtual = 0;
  }
  return valorAtual;
};

exports.getTipoProgresso = (conquista) => {
  if (
    conquista.tipo_condicao.includes("PRIMEIRA") ||
    conquista.valor_condicao === 1
  ) {
    return "binario";
  }
  if (
    conquista.tipo_condicao.includes("RECEITA") ||
    conquista.tipo_condicao.includes("VALOR_TOTAL")
  ) {
    return "monetario";
  }
  if (conquista.valor_condicao && conquista.valor_condicao > 1) {
    return "quantidade";
  }
  return "binario";
};