const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runJulia(code, _packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'julia-runner-'));
  const codePath = path.join(tempDir, 'main.jl');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write packages.txt if provided (list of Julia packages)
  let hasPackages = false;
  if (Array.isArray(opts.juliaPackages) && opts.juliaPackages.length > 0) {
    fs.writeFileSync(path.join(tempDir, 'packages.txt'), opts.juliaPackages.join('\n'));
    hasPackages = true;
  }

  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.julia');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-julia';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Mount packages.txt if present
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/main.jl"`;
  if (hasPackages) {
    runCmd += ` -v "${path.join(tempDir, 'packages.txt').replace(/\\/g, '/')}:/code/packages.txt"`;
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
