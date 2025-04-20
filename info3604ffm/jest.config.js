// info3604ffm/jest.config.js

module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation|expo(nent)?|@expo|@unimodules|unimodules|sentry-expo|native-base|@sentry|native-base)'
    ],
    setupFilesAfterEnv: [
      '@testing-library/jest-native/extend-expect'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: [
      'app/**/*.{js,jsx}',
      'components/**/*.{js,jsx}',
      '!**/node_modules/**',
      '!**/vendor/**'
    ],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1'
    },
    testPathIgnorePatterns: [
      'node_modules',
      '\\.expo',
      '\\.expo-shared'
    ],
    verbose: true
  };