# Code Execution API

This project is a modular Node.js + Express API for executing code in various languages. It is designed for easy extension to new languages and uses Docker for secure sandboxing.

## Features
- Modular language runner system
- Docker-ready for sandboxing


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

## Adding New Languages
Add a new runner module in the `runners/` directory and register it in the main API.

## Security
All code execution is sandboxed in Docker containers for isolation. You must have Docker installed and running.
