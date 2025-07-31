# Code Execution API

This project is a modular Node.js + Express API for executing code in various languages. It is designed for easy extension to new languages and uses Docker for secure sandboxing.

## Features
- Modular language runner system
- Docker-ready for sandboxing
- Configurable port via `.env` file
- Supports browser-like JS execution for pure JavaScript


## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Make sure Docker is installed and running on your system.
3. Start the server:
   ```sh
   node index.js
   ```



## Language Support Table
Below is a summary of current and planned language support. For planned languages, see notes on package support and feasibility.

| Language         | Package Support         | Execution Method         | Partial Support / Bugs / Notes |
|------------------|------------------------|--------------------------|-------------------------------|
| Node.js/JS       | npm, custom package.json| Docker, jsdom (pure JS)  | Full for JS, browser engine for pure JS only |
| Python           | pip, requirements.txt   | Docker, Pyodide          | Full for Python, Pyodide for pure code only |
| C++              | None (planned)          | Docker                   | Planned |
| C#               | .NET packages (planned) | Docker                   | Planned |
| Java             | Maven/Gradle (planned)  | Docker                   | Planned |
| Ruby             | gem (planned)           | Docker                   | Planned |
| Go               | go modules (planned)    | Docker                   | Planned |
| PHP              | composer (planned)      | Docker                   | Planned |
| Swift            | None (planned)          | Docker                   | Planned |
| Rust             | cargo (planned)         | Docker                   | Planned |
| Julia            | None (planned)          | Docker                   | Planned |
| Elixir           | None (planned)          | Docker                   | Planned |
| Perl             | cpan (planned)          | Docker                   | Planned |
| Haxe             | None (planned)          | Docker                   | Planned |
| Zig              | None (planned)          | Docker                   | Planned |
| Bash             | None                    | Docker                   | May be impossible to sandbox securely |
| Matlab           | Python packages         | Docker                   | Planned, experimental |
| R/R++            | CRAN (planned)          | Docker                   | Planned |
| F#               | .NET packages           | Docker                   | Planned |
| Lua              | luarocks (planned)      | Docker                   | Planned |
| Dart             | pub (planned)           | Docker                   | Planned |
| Haskell          | cabal (planned)         | Docker                   | Planned |
| ...              | ...                     | ...                      | See below for more |

### Other Planned/Experimental Languages
Kotlin (Java packages), Coffeescript, Cobol, Assembly, Binary, Webassembly, D, Hack, Ada, ALGOL, Prolog, Pascal, Carbon, ML, Fortran, Wolfram, Clojure, Zebra, Z++, Vlang, Unrealscript, Rocoq (Coqjs), Maple, Magma, Groovy (Java), Octave, Gdscript, BASIC, Blockly, Autohotkey, Autolisp/Visual lisp, and more. Some may be impossible or insecure to support.

## Package Support
- **Node.js**: Specify npm packages as a space-separated string or provide a custom `packageJson` in the request.
- **Python**: Specify pip packages as an array or provide a custom `requirementsTxt` in the request.
- **Other Languages**: Package support depends on the runner implementation and Dockerfile configuration.

## Usage Examples
### Node.js/JavaScript
**Run pure JS in browser engine:**
```json
{
   "code": "console.log('Hello from browser JS!')",
   "useBrowserEngine": true
}
```
**Run JS with npm packages:**
```json
{
   "code": "const _ = require('lodash'); console.log(_.uniq([1,1,2]))",
   "packages": "lodash"
}
```

### Python
**Run Python in Pyodide:**
```json
{
   "code": "print('Hello from Pyodide!')",
   "usePyodide": true
}
```
**Run Python with pip packages:**
```json
{
   "code": "import numpy as np; print(np.arange(5))",
   "packages": ["numpy"]
}
```

## Configuration
- The API port can be set via the `.env` file using the `PORT` variable.
- Docker must be installed and running for most runners.

## Extending Language Support
To add a new language:
1. Create a runner module in the `runners/` directory (see existing runners for examples).
2. Register the runner in the main API.
3. Update documentation as needed.

## Security
All code execution is sandboxed in Docker containers for isolation. You must have Docker installed and running.

## Feature Completeness
- All documented features are implemented and tested for Node.js/JavaScript and Python.
- Planned languages are listed above; see table for current status.
- If you encounter bugs or missing features, please open an issue or contribute a runner.

## Package Support
- **Node.js**: Specify npm packages as a space-separated string or provide a custom `packageJson` in the request.
- **Python**: Specify pip packages as an array or provide a custom `requirementsTxt` in the request.
- **Other Languages**: Package support depends on the runner implementation and Dockerfile configuration.

## Configuration
- The API port can be set via the `.env` file using the `PORT` variable.
- Docker must be installed and running for most runners.

## Extending Language Support
To add a new language:
1. Create a runner module in the `runners/` directory (see existing runners for examples).
2. Register the runner in the main API.
3. Update documentation as needed.

## Planned/Experimental Languages
See `langs.md` for a list of languages that may be supported in the future, including notes on package support and feasibility.

## Security
All code execution is sandboxed in Docker containers for isolation. You must have Docker installed and running.
