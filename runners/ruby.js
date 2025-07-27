// Ruby code runner using Docker
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');


module.exports = async function runRuby(code, _packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ruby-runner-'));
  const codePath = path.join(tempDir, 'code.rb');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write Gemfile if provided or gems specified
  let hasGemfile = false;
  if (opts.gemfile) {
    fs.writeFileSync(path.join(tempDir, 'Gemfile'), opts.gemfile);
    hasGemfile = true;
  } else if (Array.isArray(opts.gems) && opts.gems.length > 0) {
    const gemfileContent = 'source "https://rubygems.org"\n' + opts.gems.map(gem => `gem "${gem}"`).join('\n');
    fs.writeFileSync(path.join(tempDir, 'Gemfile'), gemfileContent);
    hasGemfile = true;
  }

  // Dynamically generate Dockerfile
  let dockerfile = 'FROM ruby:3.3-alpine\nWORKDIR /usr/src/app\nCOPY code.rb ./\n';
  if (hasGemfile) {
    dockerfile += 'COPY Gemfile ./\nRUN bundle install\n';
  }
  dockerfile += 'ENTRYPOINT ["ruby", "code.rb"]\n';
  fs.writeFileSync(path.join(tempDir, 'Dockerfile'), dockerfile);

  const imageName = 'code-runner-ruby';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Mount Gemfile if present
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/usr/src/app/code.rb"`;
  if (hasGemfile) {
    runCmd += ` -v "${path.join(tempDir, 'Gemfile').replace(/\\/g, '/')}:/usr/src/app/Gemfile"`;
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
