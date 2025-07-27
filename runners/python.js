// Python code runner using Docker
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runPython(code, packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'python-runner-'));
  const codePath = path.join(tempDir, 'code.py');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write requirements.txt if provided or packages specified
  let hasRequirements = false;
  if (opts.requirementsTxt) {
    fs.writeFileSync(path.join(tempDir, 'requirements.txt'), opts.requirementsTxt);
    hasRequirements = true;
  } else if (Array.isArray(packages) && packages.length > 0) {
    fs.writeFileSync(path.join(tempDir, 'requirements.txt'), packages.join('\n'));
    hasRequirements = true;
  }

  // Write Dockerfile dynamically with requested Python version
  const pythonVersion = opts.pythonVersion || '3.12-alpine';
  let dockerfileContent = `FROM python:${pythonVersion}\nWORKDIR /usr/src/app\nCOPY code.py ./\n`;
  if (hasRequirements) {
    dockerfileContent += `COPY requirements.txt ./\nRUN pip install -r requirements.txt\n`;
  }
  dockerfileContent += `ENTRYPOINT [\"python3\", \"code.py\"]\n`;
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfileContent);
  const imageName = 'code-runner-python';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Run code in Docker (mount requirements.txt if needed)
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/usr/src/app/code.py"`;
  if (hasRequirements) {
    runCmd += ` -v "${path.join(tempDir, 'requirements.txt').replace(/\\/g, '/')}:/usr/src/app/requirements.txt"`;
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
