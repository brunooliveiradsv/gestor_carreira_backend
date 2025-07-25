// src/__testes__/contrato.servico.test.js
const PDFDocument = require('pdfkit');
const contratoServico = require('../servicos/contrato.servico');
const { Writable } = require('stream');

// --- SIMULAÇÃO (MOCK) ATUALIZADA DO PDFKIT ---
let capturedText = '';
const mockPdfDoc = {
  pipe: jest.fn(),
  fontSize: jest.fn().mockReturnThis(),
  font: jest.fn().mockReturnThis(),
  lineGap: jest.fn().mockReturnThis(),
  text: jest.fn((text, options) => {
    capturedText += `${text}\n`;
    return mockPdfDoc;
  }),
  moveDown: jest.fn().mockReturnThis(),
  list: jest.fn((items) => {
    items.forEach(item => {
      capturedText += `- ${item}\n`;
    });
    return mockPdfDoc;
  }),
  end: jest.fn(),
  // --- CORREÇÃO AQUI ---
  // Adicionamos as propriedades em falta com valores fictícios para os cálculos de layout
  y: 700, // Um valor fictício para a posição vertical (doc.y)
  page: {   // Um objeto fictício para a página (doc.page)
    width: 612, // Largura padrão de uma página A4 em pontos
    margins: {
      left: 72,
      right: 72,
    },
  },
};

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => mockPdfDoc);
});

describe('Testes do Serviço de Geração de Contratos', () => {

  beforeEach(() => {
    capturedText = '';
    jest.clearAllMocks();
  });

  it('Deve gerar o texto do contrato corretamente', () => {
    // 1. Criar dados de teste (mocks)
    const compromissoMock = {
      nome_evento: 'Show Acústico na Praça',
      data: new Date('2025-12-25T20:00:00.000Z'),
      local: 'Praça da Matriz, Mirassol',
      valor_cache: 1500.75,
    };
    const contratanteMock = {
      nome: 'Prefeitura de Mirassol',
      nif: '12.345.678/0001-99',
      morada: 'Rua Principal, 123, Centro',
      forma_pagamento: '50% adiantado, 50% no dia do evento.',
      cidade_foro: 'Mirassol',
      estado_foro: 'SP',
    };
    const artistaMock = {
      nome: 'Bruno Oliveira',
    };
    const streamMock = new Writable({
        write(chunk, encoding, callback) {
          callback();
        }
    });

    // 2. Chamar a função que queremos testar
    contratoServico.gerarContratoPDF(compromissoMock, contratanteMock, artistaMock, streamMock);

    // 3. Usar toMatchSnapshot()
    expect(capturedText).toMatchSnapshot();
  });
});