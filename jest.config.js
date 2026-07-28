// Jest config scoped to the pure-logic content modules (features/content). These have
// no React Native imports, so we transpile with ts-jest under an explicit CommonJS
// tsconfig (ignoring the app's bundler moduleResolution) — no jest-expo/RN preset needed.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/features/content/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          skipLibCheck: true,
          target: 'es2019',
          strict: true,
        },
      },
    ],
  },
};
