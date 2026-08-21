import { spawn } from 'node:child_process';

const child = spawn('pnpm', ['cf:build'], {
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let buildOutput = '';

function forward(stream, destination) {
  stream.on('data', (chunk) => {
    destination.write(chunk);
    buildOutput += chunk.toString();
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on('error', (error) => {
  console.error(`[cf-build] Failed to start: ${error.message}`);
  process.exitCode = 1;
});

child.on('close', (code, signal) => {
  if (code !== 0) {
    process.exitCode = code || 1;
    return;
  }

  if (buildOutput.includes('IMPORT_IS_UNDEFINED')) {
    console.error(
      '[cf-build] Refusing deployment: the client bundle contains undefined imports.'
    );
    process.exitCode = 1;
    return;
  }

  if (signal) {
    console.error(`[cf-build] Build terminated by signal ${signal}.`);
    process.exitCode = 1;
  }
});
