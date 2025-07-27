const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

module.exports = async function runCSharp(code, _packages, opts = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csharp-runner-'));
  const codePath = path.join(tempDir, 'Program.cs');
  fs.writeFileSync(codePath, code, 'utf8');

  // Write .csproj if provided
  if (opts.csproj) {
    fs.writeFileSync(path.join(tempDir, 'App.csproj'), opts.csproj);
  } else if (Array.isArray(opts.nugetPackages) && opts.nugetPackages.length > 0) {
    // Generate a basic csproj with the requested packages
    const pkgs = opts.nugetPackages.map(pkg => `    <PackageReference Include=\"${pkg.name}\" Version=\"${pkg.version || 'latest'}\" />`).join('\n');
    const csproj = `<Project Sdk=\"Microsoft.NET.Sdk\">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net8.0</TargetFramework>\n  </PropertyGroup>\n  <ItemGroup>\n${pkgs}\n  </ItemGroup>\n</Project>`;
    fs.writeFileSync(path.join(tempDir, 'App.csproj'), csproj);
  }

  const dockerfilePath = path.resolve(__dirname, 'Dockerfile.csharp');
  fs.copyFileSync(dockerfilePath, path.join(tempDir, 'Dockerfile'));
  const imageName = 'code-runner-csharp';
  await new Promise((resolve, reject) => {
    exec(`docker build -t ${imageName} .`, { cwd: tempDir }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || stdout));
      resolve();
    });
  });
  // Mount Program.cs and App.csproj if present
  let runCmd = `docker run --rm -v "${codePath.replace(/\\/g, '/')}:/code/Program.cs"`;
  if (opts.csproj || (Array.isArray(opts.nugetPackages) && opts.nugetPackages.length > 0)) {
    runCmd += ` -v "${path.join(tempDir, 'App.csproj').replace(/\\/g, '/')}:/code/App.csproj"`;
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
