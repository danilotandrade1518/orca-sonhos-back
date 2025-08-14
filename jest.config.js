/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Aumenta o timeout padrão dos testes (útil para integrações com TestContainers / banco)
  testTimeout: 120000, // 120s
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '**/?(*.)+(spec).[tj]s', // padrão para unitários
    '**/?(*.)+(test).[tj]s', // padrão para integrados
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/errors/*.ts',
    '!src/**/*Error.ts'
  ],
  moduleNameMapper: {
    '^@either$': '<rootDir>/src/shared/core/either.ts',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  },
};
