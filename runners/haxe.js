const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runHaxe(code) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'haxe-runner-'));
  const codePath = path.join(tempDir, 'Main.hx');
  fs.writeFileSync(codePath, code, 'utf8');
  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.haxe');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-haxe';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  return new Promise((resolve) => {
    exec(`docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/Main.hx" ${imageName}`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: stderr || err.message });
      } else {
        resolve({ output: stdout.trim() });
      }
    });
  });
};
