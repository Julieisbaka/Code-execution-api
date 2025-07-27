const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runRust(code, _packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-runner-'));
  const codePath = path.join(tempDir, 'main.rs');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write Cargo.toml if provided
  if (opts.cargoToml) {
    fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), opts.cargoToml);
  }
  // Write build.rs if provided
  if (opts.buildRs) {
    fs.writeFileSync(path.join(tempDir, 'build.rs'), opts.buildRs);
  }

  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.rust');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-rust';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Mount Cargo.toml and build.rs if present
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/main.rs"`;
  if (opts.cargoToml) {
    runCmd += ` -v "${path.join(tempDir, 'Cargo.toml').replace(/\\/g, '/')}:/code/Cargo.toml"`;
  }
  if (opts.buildRs) {
    runCmd += ` -v "${path.join(tempDir, 'build.rs').replace(/\\/g, '/')}:/code/build.rs"`;
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
