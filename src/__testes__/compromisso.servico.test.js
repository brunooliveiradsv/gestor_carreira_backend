// src/__testes__/compromisso.servico.test.js
const conexao = require('../database');
// --- CORREÇÃO AQUI ---
// O único serviço que este ficheiro deve importar diretamente é o que está a ser testado.
const compromissoServico = require('../servicos/compromisso.servico');

describe('Testes do Serviço de Compromissos', () => {
  let usuario;
  let musica1;
  let musica2;
  let setlist;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    // Popular a base de dados com as conquistas
    const seeder = require('../../seeders/20250707103229-popular-conquistas');
    await seeder.up(conexao.getQueryInterface());

    // Criar dados base para os testes
    const { Usuario, Musica, Setlist } = conexao.models;
    usuario = await Usuario.create({ nome: 'Utilizador Servico', email: 'servico@teste.com', senha: '123' });
    musica1 = await Musica.create({ nome: 'Música A', artista: 'Banda', popularidade: 5, usuario_id: usuario.id });
    musica2 = await Musica.create({ nome: 'Música B', artista: 'Banda', popularidade: 10, usuario_id: usuario.id });
    setlist = await Setlist.create({ nome: 'Setlist Principal', usuario_id: usuario.id });
    await setlist.addMusicas([musica1, musica2]);
  });

  afterAll(async () => {
    await conexao.close();
  });

  it('Deve processar todas as automações de um compromisso realizado com sucesso', async () => {
    // 1. Criar um compromisso de teste
    const { Compromisso } = conexao.models;
    const dataCompromisso = new Date();
    const compromisso = await Compromisso.create({
      usuario_id: usuario.id,
      setlist_id: setlist.id,
      tipo: 'Show',
      nome_evento: 'Show de Teste de Serviço',
      data: dataCompromisso,
      status: 'Realizado',
      valor_cache: 1000.00,
    });

    // 2. Executar a função do serviço
    await compromissoServico.processarCompromissoRealizado(compromisso, conexao);

    // 3. Verificar todos os efeitos na base de dados
    const { Transacao, Notificacao, Musica } = conexao.models;

    // a) Verificar receita
    const receita = await Transacao.findOne({ where: { compromisso_id: compromisso.id, tipo: 'receita' } });
    expect(receita).not.toBeNull();
    expect(parseFloat(receita.valor)).toBe(1000.00);

    // b) Verificar músicas
    const musica1Atualizada = await Musica.findByPk(musica1.id);
    const musica2Atualizada = await Musica.findByPk(musica2.id);
    expect(musica1Atualizada.popularidade).toBe(6);
    expect(musica2Atualizada.popularidade).toBe(11);
    expect(musica1Atualizada.ultima_vez_tocada.toISOString().split('T')[0]).toBe(dataCompromisso.toISOString().split('T')[0]);

    // c) Verificar conquistas (através das notificações)
    const notificacoes = await Notificacao.findAll({ where: { usuario_id: usuario.id } });
    const mensagens = notificacoes.map(n => n.mensagem);
    
    expect(mensagens.some(m => m.includes('No Palco'))).toBe(true);
    expect(mensagens.some(m => m.includes('Primeiro Cachê'))).toBe(true);
  });
});