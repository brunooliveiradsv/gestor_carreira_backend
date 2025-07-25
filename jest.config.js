// jest.config.js
module.exports = {
  // O ambiente de teste que será usado para os testes
  testEnvironment: 'node',
  // Ignora a pasta node_modules ao procurar por testes
  testPathIgnorePatterns: ['/node_modules/'],
  // Limpa os mocks entre cada teste para garantir isolamento
  clearMocks: true,
  // Define um tempo limite maior para testes que envolvem a base de dados
  testTimeout: 10000,
};