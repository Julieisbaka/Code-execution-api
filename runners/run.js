// This script will be used as the entrypoint in the Docker container
// It reads code from a file and executes it
const fs = require('fs');

const CODE_FILE = 'code.js';

try {
  const code = fs.readFileSync(CODE_FILE, 'utf8');
  // eslint-disable-next-line no-eval
  const result = eval(code);
  if (result !== undefined) {
    console.log(result);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
