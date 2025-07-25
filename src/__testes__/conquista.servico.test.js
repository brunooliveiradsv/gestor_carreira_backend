// src/__testes__/conquista.servico.test.js
const conexao = require('../database');
const conquistaServico = require('../servicos/conquista.servico');

describe('Testes do Serviço de Conquistas', () => {
  let usuario;

  beforeEach(async () => {
    await conexao.sync({ force: true });
    const seeder = require('../../seeders/20250707103229-popular-conquistas');
    await seeder.up(conexao.getQueryInterface());

    const { Usuario } = conexao.models;
    usuario = await Usuario.create({ nome: 'Utilizador de Teste de Serviço', email: 'service.test@email.com', senha: '123' });
  });

  afterAll(async () => {
    await conexao.close();
  });

  describe('Testes para calcularProgressoAtual', () => {
    it('Deve contar corretamente os shows realizados', async () => {
      const { Compromisso } = conexao.models;
      await Compromisso.create({ tipo: 'Show', status: 'Realizado', nome_evento: 'S1', data: new Date(), usuario_id: usuario.id });
      await Compromisso.create({ tipo: 'Show', status: 'Realizado', nome_evento: 'S2', data: new Date(), usuario_id: usuario.id });
      
      const progresso = await conquistaServico.calcularProgressoAtual(usuario.id, 'CONTAGEM_SHOWS_REALIZADOS', conexao);
      
      expect(progresso).toBe(2);
    });

    it('Deve somar corretamente o total de receitas', async () => {
      const { Transacao } = conexao.models;
      await Transacao.create({ tipo: 'receita', valor: 1000, descricao: 'R1', data: new Date(), usuario_id: usuario.id });
      await Transacao.create({ tipo: 'receita', valor: 550.50, descricao: 'R2', data: new Date(), usuario_id: usuario.id });

      const progresso = await conquistaServico.calcularProgressoAtual(usuario.id, 'TOTAL_RECEITAS', conexao);

      expect(progresso).toBe(1550.50);
    });
  });

  describe('Testes para verificarEConcederConquistas', () => {
    // --- TESTE CORRIGIDO ---
    it('Deve conceder uma conquista quando a condição for atingida', async () => {
      const { Contato, UsuarioConquista, Notificacao } = conexao.models;
      
      for (let i = 0; i < 10; i++) {
        await Contato.create({ nome: `Contato ${i}`, usuario_id: usuario.id });
      }

      await conquistaServico.verificarEConcederConquistas(usuario.id, 'CONTAGEM_CONTATOS', conexao);

      // CORREÇÃO: Busca TODAS as conquistas desbloqueadas
      const conquistasDesbloqueadas = await UsuarioConquista.findAll({
        where: { usuario_id: usuario.id },
        include: 'conquista'
      });
      
      // Verifica se o array de conquistas tem o tamanho esperado (2)
      expect(conquistasDesbloqueadas).toHaveLength(2);

      // Verifica se a conquista "Bem Relacionado" está DENTRO do array
      const nomesDasConquistas = conquistasDesbloqueadas.map(c => c.conquista.nome);
      expect(nomesDasConquistas).toContain('Bem Relacionado');
      expect(nomesDasConquistas).toContain('Quebrando o Gelo');

      // Verifica se a notificação foi criada
      const notificacao = await Notificacao.findOne({ where: { usuario_id: usuario.id, mensagem: { [conexao.Sequelize.Op.like]: '%Bem Relacionado%' } } });
      expect(notificacao).not.toBeNull();
    });

    it('NÃO deve conceder uma conquista se ela já foi desbloqueada', async () => {
        const { Contato, Conquista } = conexao.models;
        
        const conquistaGelo = await Conquista.findOne({ where: { nome: 'Quebrando o Gelo' } });
        await usuario.addConquista(conquistaGelo, { through: { data_desbloqueio: new Date() } });

        await Contato.create({ nome: 'Contato Novo', usuario_id: usuario.id });
        await conquistaServico.verificarEConcederConquistas(usuario.id, 'CONTAGEM_CONTATOS', conexao);
        
        const totalConquistas = await usuario.countConquistas();
        expect(totalConquistas).toBe(1);
    });
  });
});