// Python code runner using Docker
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');


module.exports = async function runPython(code, packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'python-runner-'));

  // Language detection: opts.lang ('python' or 'hylang'), or auto-detect
  let lang = opts.lang;
  if (!lang) {
    // Heuristic: if code starts with ( or contains (defn or (import or (print, treat as hylang
    const codeSample = code.trim().slice(0, 200);
    if (/^\(|\(defn|\(import|\(print|\(def/.test(codeSample)) {
      lang = 'hylang';
    } else {
      lang = 'python';
    }
  }

  let codeFile, entryCmd;
  if (lang === 'hylang') {
    codeFile = 'code.hy';
    entryCmd = '["hy", "code.hy"]';
  } else {
    codeFile = 'code.py';
    entryCmd = '["python3", "code.py"]';
  }
  const codePath = path.join(tempDir, codeFile);
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
  let dockerfileContent = `FROM python:${pythonVersion}\nWORKDIR /usr/src/app\nCOPY ${codeFile} ./\n`;
  if (hasRequirements) {
    dockerfileContent += `COPY requirements.txt ./\nRUN pip install -r requirements.txt\n`;
  }
  // Always install hy
  dockerfileContent += `RUN pip install hy\n`;
  dockerfileContent += `ENTRYPOINT ${entryCmd}\n`;
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfileContent);
  const imageName = 'code-runner-python';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Run code in Docker
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/usr/src/app/${codeFile}" ${imageName}`;
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
