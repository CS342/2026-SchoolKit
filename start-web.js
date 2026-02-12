#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

// Load polyfills
require('./polyfills.js');

// Then start expo
const { spawnSync } = require('child_process');

const result = spawnSync('npx', ['expo', 'start', '--web'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }, // Pass environment variables to child process
});

process.exit(result.status);
