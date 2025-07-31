// Node.js code runner (to be executed in Docker in the future)
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runNode(code, packages, opts = {}) {
  const useBrowserEngine = opts.useBrowserEngine || false;
  // If useBrowserEngine is true and no packages, run code in jsdom
  if (useBrowserEngine && (!packages || (typeof packages === 'string' && !packages.trim()))) {
    try {
      const { JSDOM } = require('jsdom');
      let output = '';
      // Patch console.log to capture output
      const dom = new JSDOM(``, { runScripts: "outside-only" });
      dom.window.console.log = (...args) => { output += args.join(' ') + '\n'; };
      dom.window.eval(code);
      return { output: output.trim() };
    } catch (err) {
      return { error: err.message || String(err) };
    }
  }
  // ...existing code for Node.js/Docker...
  // Write code to a temp file
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'node-runner-'));
  const codePath = path.join(tempDir, 'code.js');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write package.json if provided or packages specified
  let hasPackageJson = false;
  if (opts.packageJson) {
    let pkgContent = opts.packageJson;
    if (typeof pkgContent === 'object') {
      pkgContent = JSON.stringify(pkgContent, null, 2);
    }
    fs.writeFileSync(path.join(tempDir, 'package.json'), pkgContent);
    hasPackageJson = true;
  } else if (packages && typeof packages === 'string' && packages.trim()) {
    const pkgJson = {
      name: 'runner',
      version: '1.0.0',
      description: '',
      main: 'code.js',
      dependencies: {}
    };
    packages.split(/\s+/).forEach(pkg => {
      const [name, version] = pkg.split('@');
      pkgJson.dependencies[name] = version || 'latest';
    });
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
    hasPackageJson = true;
  }

  // Write Dockerfile dynamically with requested Node.js version
  const runjsPath = path.resolve(__dirname, 'run.js');
  const imageName = 'code-runner-node';
  fs.copyFileSync(runjsPath, path.join(tempDir, 'run.js'));
  const nodeVersion = opts.nodeVersion || '20-alpine';
  let dockerfileContent = `FROM node:${nodeVersion}\nWORKDIR /usr/src/app\nCOPY run.js ./\n`;
  if (hasPackageJson) {
    dockerfileContent += `COPY package.json ./\nRUN npm install\n`;
  }
  dockerfileContent += `ENTRYPOINT [\"node\", \"run.js\"]\n`;
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfileContent);

  // Build image (idempotent)
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });

  // Run code in Docker (install packages if needed)
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/usr/src/app/code.js"`;
  if (hasPackageJson) {
    runCmd += ` -v "${path.join(tempDir, 'package.json').replace(/\\/g, '/')}:/usr/src/app/package.json"`;
  }
  runCmd += ` ${imageName}`;

  return new Promise((resolve) => {
    exec(runCmd, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: stderr || err.message });
      } else {
        resolve({ output: stdout.trim() });
      }
    });
  });
};
