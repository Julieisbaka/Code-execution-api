const { exec } = require('child_process');
// Check if Docker is running at server startup
exec('docker info', (err) => {
  if (err) {
    console.error('[ERROR] Docker is not running or not installed. Please start Docker for code execution to work.');
  }
});

require('dotenv').config();
const express = require('express');
const app = express();
const port = 5000;
// Serve static files for frontend, configurable root
const frontendRoot = process.env.FRONTEND_ROOT || 'public';
app.use(express.static(frontendRoot));

app.use(express.json());

// Modular runner loader
const nodeRunner = require('./runners/node');
const pythonRunner = require('./runners/python');
const rubyRunner = require('./runners/ruby');
const javaRunner = require('./runners/java');
const goRunner = require('./runners/go');
const rustRunner = require('./runners/rust');
const erlangRunner = require('./runners/erlang');
const cppRunner = require('./runners/cpp');
const csharpRunner = require('./runners/csharp');
const elixirRunner = require('./runners/elixir');
const phpRunner = require('./runners/php');
const hylangRunner = require('./runners/hylang');
const swiftRunner = require('./runners/swift');
const zigRunner = require('./runners/zig');
const perlRunner = require('./runners/perl');
const haxeRunner = require('./runners/haxe');
const juliaRunner = require('./runners/julia');
const runners = {
  node: nodeRunner,
  python: pythonRunner,
  ruby: rubyRunner,
  java: javaRunner,
  go: goRunner,
  rust: rustRunner,
  erlang: erlangRunner,
  cpp: cppRunner,
  csharp: csharpRunner,
  elixir: elixirRunner,
  php: phpRunner,
  hylang: hylangRunner,
  swift: swiftRunner,
  zig: zigRunner,
  perl: perlRunner,
  haxe: haxeRunner,
  julia: juliaRunner
};

app.post('/execute', async (req, res) => {
  const { language, code, packages, requirementsTxt, packageJson, gems, gemfile, nodeVersion, pythonVersion, nugetPackages, csproj } = req.body;
  if (!language || !code) {
    return res.status(400).json({ error: 'Missing language or code' });
  }
  const runner = runners[language];
  if (!runner) {
    return res.status(400).json({ error: 'Unsupported language' });
  }
  try {
  const result = await runner(code, packages, { requirementsTxt, packageJson, gems, gemfile, nodeVersion, pythonVersion, nugetPackages, csproj });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Code execution API listening at http://localhost:${port}`);
});
