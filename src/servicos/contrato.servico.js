// src/servicos/contrato.servico.js
const PDFDocument = require('pdfkit');

function adicionarTexto(doc, texto) {
    doc.font('Helvetica').fontSize(11).lineGap(5).text(texto, { align: 'justify' });
    doc.moveDown();
}

function adicionarClausula(doc, numero, titulo) {
    doc.font('Helvetica-Bold').fontSize(12).text(`Cláusula ${numero}ª - ${titulo}`, { underline: true });
    doc.moveDown(0.5);
}

exports.gerarContratoPDF = (compromisso, contratante, artista, stream) => {
  const doc = new PDFDocument({ margin: 72 });
  doc.pipe(stream);

  const dataCompromisso = new Date(compromisso.data);
  const opcoesData = { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' };
  const opcoesHora = { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' };
  const dataFormatada = dataCompromisso.toLocaleDateString('pt-BR', opcoesData);
  const horaFormatada = dataCompromisso.toLocaleTimeString('pt-BR', opcoesHora);
  const valorCache = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(compromisso.valor_cache || 0);

  doc.fontSize(16).font('Helvetica-Bold').text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS', { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica-Bold').text('DAS PARTES');
  doc.moveDown(0.5);
  adicionarTexto(doc, `CONTRATANTE: ${contratante.nome}, portador(a) do CPF/CNPJ nº ${contratante.nif}, com morada em ${contratante.morada}, doravante designado(a) simplesmente como CONTRATANTE.`);
  adicionarTexto(doc, `CONTRATADO: ${artista.nome}, músico(a) profissional, doravante designado(a) simplesmente como CONTRATADO.`);
  doc.moveDown();

  adicionarClausula(doc, '1ª', 'DO OBJETO');
  adicionarTexto(doc, `O presente contrato tem como objeto a apresentação musical do CONTRATADO no evento "${compromisso.nome_evento}", a ser realizado no dia ${dataFormatada}.`);

  adicionarClausula(doc, '2ª', 'DO LOCAL E HORÁRIO');
  adicionarTexto(doc, `A apresentação ocorrerá no seguinte local: ${compromisso.local}. O CONTRATADO deverá estar disponível no local com, no mínimo, 60 (sessenta) minutos de antecedência. A apresentação terá início previsto para as ${horaFormatada}h.`);

  adicionarClausula(doc, '3ª', 'DAS OBRIGAÇÕES DO CONTRATADO');
  adicionarTexto(doc, `Compete ao CONTRATADO:`);
  doc.list([
      `Realizar a apresentação musical conforme acordado, com duração aproximada a ser definida entre as partes.`,
      `Comparecer ao local do evento no horário estipulado, munido de seus instrumentos e equipamentos pessoais necessários à apresentação.`,
      `Zelar pela qualidade técnica e artística da apresentação.`
  ], { bulletRadius: 2, textIndent: 10 });
  doc.moveDown();

  adicionarClausula(doc, '4ª', 'DAS OBRIGAÇÕES DO CONTRATANTE');
  adicionarTexto(doc, `Compete ao CONTRATANTE:`);
  doc.list([
      `Disponibilizar um local seguro e adequado para o CONTRATADO se apresentar.`,
      `Garantir a segurança do CONTRATADO e de seus equipamentos durante todo o período de sua permanência no local do evento.`,
      `Efetuar o pagamento do cachê nos termos da Cláusula 5ª.`
  ], { bulletRadius: 2, textIndent: 10 });
  doc.moveDown();
  
  adicionarClausula(doc, '5ª', 'DO PAGAMENTO');
  // --- ALTERAÇÃO AQUI: Usa o novo campo 'forma_pagamento' ---
  adicionarTexto(doc, `A título de remuneração (cachê), o CONTRATANTE pagará ao CONTRATADO o valor total de ${valorCache}. O pagamento deverá ser efetuado da seguinte forma: ${contratante.forma_pagamento}.`);

  adicionarClausula(doc, '6ª', 'DA RESCISÃO');
  adicionarTexto(doc, `O cancelamento por qualquer uma das partes deverá ser comunicado com antecedência mínima de 15 (quinze) dias. O descumprimento desta cláusula por parte do CONTRATANTE implicará no pagamento de uma multa de 50% do valor total do cachê. Caso o cancelamento parta do CONTRATADO, este deverá restituir qualquer valor já recebido.`);
  
  adicionarClausula(doc, '7ª', 'DAS DISPOSIÇÕES GERAIS');
  adicionarTexto(doc, `O CONTRATANTE autoriza o uso de imagem e som da apresentação para fins de divulgação e portfólio do CONTRATADO. Este contrato não estabelece qualquer vínculo empregatício entre as partes, tratando-se de uma prestação de serviço autônoma.`);

  adicionarClausula(doc, '8ª', 'DO FORO');
  // --- ALTERAÇÃO AQUI: Usa os novos campos 'cidade_foro' e 'estado_foro' ---
  adicionarTexto(doc, `Fica eleito o foro da comarca de ${contratante.cidade_foro}, ${contratante.estado_foro}, para dirimir quaisquer dúvidas oriundas do presente contrato.`);
  doc.moveDown(4);

  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  // --- ALTERAÇÃO AQUI: Usa o novo campo 'cidade_foro' ---
  doc.fontSize(11).text(`${contratante.cidade_foro}, ${dataHoje}.`, { align: 'center' });
  doc.moveDown(3);

  // --- ASSINATURAS LADO A LADO (CORRIGIDO) ---
  const assinaturaY = doc.y; // Posição Y inicial para os blocos de assinatura
  const margin = doc.page.margins.left;
  const larguraUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const larguraColuna = larguraUtil / 2 - 20;
  
  const coluna1X = margin;
  const coluna2X = margin + larguraUtil / 2 + 20;

  // Linhas de assinatura
  doc.font('Helvetica').text('________________________________', coluna1X, assinaturaY, { width: larguraColuna, align: 'center' });
  doc.text('________________________________', coluna2X, assinaturaY, { width: larguraColuna, align: 'center' });
  doc.moveDown(0.5);

  // Nomes
  const nomeY = doc.y;
  doc.text(contratante.nome, coluna1X, nomeY, { width: larguraColuna, align: 'center' });
  doc.text(artista.nome, coluna2X, nomeY, { width: larguraColuna, align: 'center' });
  doc.moveDown(0.5);

  // Títulos
  const tituloY = doc.y;
  doc.font('Helvetica-Bold').text('CONTRATANTE', coluna1X, tituloY, { width: larguraColuna, align: 'center' });
  doc.font('Helvetica-Bold').text('CONTRATADO', coluna2X, tituloY, { width: larguraColuna, align: 'center' });

  // Finaliza o PDF
  doc.end();
};