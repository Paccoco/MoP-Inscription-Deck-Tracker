module.exports = {
  // Test environment setup
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Projects for different test types
  projects: [
    {
      displayName: 'API Tests',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/api/*.test.js', '<rootDir>/tests/api.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-api.js']
    },
    {
      displayName: 'Client Tests',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/client/*.test.js', '<rootDir>/tests/client.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-client.js'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      }
    },
    {
      displayName: 'Integration Tests',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-integration.js']
    }
  ]
};
