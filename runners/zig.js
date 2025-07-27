const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runZig(code) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zig-runner-'));
  const codePath = path.join(tempDir, 'main.zig');
  fs.writeFileSync(codePath, code, 'utf8');
  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.zig');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-zig';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  return new Promise((resolve) => {
    exec(`docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/main.zig" ${imageName}`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: stderr || err.message });
      } else {
        resolve({ output: stdout.trim() });
      }
    });
  });
};
