// src/servicos/contrato.servico.js
const PDFDocument = require('pdfkit');

exports.gerarContratoPDF = (compromisso, contratante, artista, stream) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // --- OPÇÕES DE FORMATAÇÃO DE DATA E HORA COM FUSO HORÁRIO CORRETO ---
  const opcoesData = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo' // Força o fuso horário do Brasil
  };
  const opcoesHora = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo' // Força o fuso horário do Brasil
  };

  // --- CABEÇALHO ---
  doc.fontSize(20).font('Helvetica-Bold').text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS', { align: 'center' });
  doc.moveDown(2);

  // --- PARTES ENVOLVIDAS ---
  doc.fontSize(12).font('Helvetica-Bold').text('CONTRATANTE:', { continued: true });
  doc.font('Helvetica').text(` ${contratante.nome}, NIF/CPF: ${contratante.nif}, com morada em ${contratante.morada}.`);
  doc.moveDown();

  doc.font('Helvetica-Bold').text('CONTRATADO:', { continued: true });
  doc.font('Helvetica').text(` ${artista.nome}, atuando como artista.`);
  doc.moveDown(2);

  // --- CLÁUSULAS DO CONTRATO ---
  doc.fontSize(14).font('Helvetica-Bold').text('Cláusula 1ª - Objeto do Contrato', { underline: true });
  doc.fontSize(12).font('Helvetica').text(
    // --- CORREÇÃO AQUI: Usa as novas opções de formatação ---
    `O presente contrato tem como objeto a prestação de serviços artísticos musicais pelo CONTRATADO para o evento "${compromisso.nome_evento}", a ser realizado em ${new Date(compromisso.data).toLocaleDateString('pt-BR', opcoesData)}.`,
    { align: 'justify' }
  );
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Cláusula 2ª - Local e Horário', { underline: true });
  doc.fontSize(12).font('Helvetica').text(
    // --- CORREÇÃO AQUI: Usa as novas opções de formatação ---
    `A apresentação ocorrerá em ${compromisso.local}, com início previsto para as ${new Date(compromisso.data).toLocaleTimeString('pt-BR', opcoesHora)}h.`,
    { align: 'justify' }
  );
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Cláusula 3ª - Pagamento', { underline: true });
  const valorCache = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(compromisso.valor_cache || 0);
  doc.fontSize(12).font('Helvetica').text(
    `A título de cachê, o CONTRATANTE pagará ao CONTRATADO o valor de ${valorCache}.`,
    { align: 'justify' }
  );
  doc.moveDown(3);

  // --- ASSINATURAS ---
  doc.text('______________________________________', { align: 'center' });
  doc.text(contratante.nome, { align: 'center' });
  doc.text('(Contratante)', { align: 'center' });
  doc.moveDown(2);

  doc.text('______________________________________', { align: 'center' });
  doc.text(artista.nome, { align: 'center' });
  doc.text('(Contratado)', { align: 'center' });

  // Finaliza o PDF
  doc.end();
};