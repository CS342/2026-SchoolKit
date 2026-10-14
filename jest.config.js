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
          // TS 6.0 requires an explicit rootDir when sources span directories.
          rootDir: '.',
          moduleResolution: 'node10',
          // TS 6.0 turned the deprecated node10 resolver into a hard error; keep it
          // (these pure-logic tests emit CommonJS for Node) and silence until TS 7.0.
          ignoreDeprecations: '6.0',
          esModuleInterop: true,
          skipLibCheck: true,
          target: 'es2019',
          strict: true,
        },
      },
    ],
  },
};
