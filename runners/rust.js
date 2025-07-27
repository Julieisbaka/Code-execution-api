const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');


module.exports = async function runRust(code, _packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-runner-'));
  const codePath = path.join(tempDir, 'main.rs');
  fs.writeFileSync(codePath, code, 'utf8');

  let hasCargoToml = false;
  let hasBuildRs = false;
  if (opts.cargoToml) {
    fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), opts.cargoToml);
    hasCargoToml = true;
  }
  if (opts.buildRs) {
    fs.writeFileSync(path.join(tempDir, 'build.rs'), opts.buildRs);
    hasBuildRs = true;
  }

  // Dynamically generate Dockerfile
  let dockerfile = 'FROM rust:1.77-alpine\nWORKDIR /code\nCOPY main.rs ./\n';
  if (hasCargoToml) dockerfile += 'COPY Cargo.toml ./\n';
  if (hasBuildRs) dockerfile += 'COPY build.rs ./\n';
  dockerfile += 'RUN if [ -f Cargo.toml ]; then cargo build --release; else rustc main.rs -o main; fi\n';
  dockerfile += 'CMD ["/bin/sh", "-c", "if [ -f Cargo.toml ]; then ./target/release/main; else ./main; fi"]\n';
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);

  const imageName = 'code-runner-rust';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Mount Cargo.toml and build.rs if present
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/main.rs"`;
  if (hasCargoToml) {
    runCmd += ` -v "${path.join(tempDir, 'Cargo.toml').replace(/\\/g, '/')}:/code/Cargo.toml"`;
  }
  if (hasBuildRs) {
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
