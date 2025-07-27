// Java code runner using Docker
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runJava(code) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'java-runner-'));
  const codePath = path.join(tempDir, 'Main.java');
  fs.writeFileSync(codePath, code, 'utf8');
  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.java');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-java';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  return new Promise((resolve) => {
    exec(`docker run --rm -v "${codePath.replace(/\\/g, '/')}:/usr/src/app/Main.java" ${imageName}`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) {
        resolve({ error: stderr || err.message });
      } else {
        resolve({ output: stdout.trim() });
      }
    });
  });
};
