/**
 * POST /api/execute
 *
 * Body: { code: string, language: "cpp" | "python" | "java", input: string }
 * Response: { output: string } | { error: string }
 *
 * Runs user code in a sandboxed child process using Docker (recommended for
 * production) or a local subprocess fallback. The current implementation uses
 * local subprocesses — safe enough for a student project on a controlled
 * server, but see the Docker section below before exposing to the internet.
 */

const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ── Constants ────────────────────────────────────────────────────────────────
const TIMEOUT_MS = 8000;        // kill after 8 s
const MAX_OUTPUT_BYTES = 4096;  // truncate huge stdout

// ── Helpers ──────────────────────────────────────────────────────────────────
function tmpDir() {
  return path.join(os.tmpdir(), `codify_${uuidv4()}`);
}

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

function truncate(str) {
  if (str.length > MAX_OUTPUT_BYTES) {
    return str.slice(0, MAX_OUTPUT_BYTES) + '\n[output truncated]';
  }
  return str;
}

// ── Language runners ─────────────────────────────────────────────────────────
/**
 * Each runner returns a Promise<{ output, error }>
 * They write code to a temp directory, compile if needed, then run with stdin.
 */

async function runCpp(code, input) {
  const dir = tmpDir();
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, 'main.cpp');
  const bin = path.join(dir, 'main');
  fs.writeFileSync(src, code);

  return new Promise((resolve) => {
    // Step 1: compile
    execFile('g++', ['-O2', '-o', bin, src], { timeout: 10000 }, (compileErr, _, stderr) => {
      if (compileErr) {
        cleanup(dir);
        return resolve({ output: '', error: stderr || 'Compilation error' });
      }

      // Step 2: run
      const proc = execFile(bin, [], { timeout: TIMEOUT_MS }, (runErr, stdout, runStderr) => {
        cleanup(dir);
        if (runErr && runErr.killed) return resolve({ output: '', error: 'Time Limit Exceeded' });
        if (runErr) return resolve({ output: '', error: runStderr || runErr.message });
        resolve({ output: truncate(stdout), error: '' });
      });

      proc.stdin.write(input);
      proc.stdin.end();
    });
  });
}

async function runPython(code, input) {
  const dir = tmpDir();
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, 'main.py');
  fs.writeFileSync(src, code);

  return new Promise((resolve) => {
    const proc = execFile('python3', [src], { timeout: TIMEOUT_MS }, (err, stdout, stderr) => {
      cleanup(dir);
      if (err && err.killed) return resolve({ output: '', error: 'Time Limit Exceeded' });
      if (err) return resolve({ output: '', error: stderr || err.message });
      resolve({ output: truncate(stdout), error: '' });
    });
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

async function runJava(code, input) {
  const dir = tmpDir();
  fs.mkdirSync(dir, { recursive: true });
  const src = path.join(dir, 'Main.java');
  fs.writeFileSync(src, code);

  return new Promise((resolve) => {
    // Step 1: compile
    execFile('javac', [src], { timeout: 15000 }, (compileErr, _, stderr) => {
      if (compileErr) {
        cleanup(dir);
        return resolve({ output: '', error: stderr || 'Compilation error' });
      }

      // Step 2: run  (classpath = temp dir, main class = Main)
      const proc = execFile('java', ['-cp', dir, 'Main'], { timeout: TIMEOUT_MS }, (runErr, stdout, runStderr) => {
        cleanup(dir);
        if (runErr && runErr.killed) return resolve({ output: '', error: 'Time Limit Exceeded' });
        if (runErr) return resolve({ output: '', error: runStderr || runErr.message });
        resolve({ output: truncate(stdout), error: '' });
      });

      proc.stdin.write(input);
      proc.stdin.end();
    });
  });
}

// ── Route ────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { code, language, input = '' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required' });
  }
  if (!['cpp', 'python', 'java'].includes(language)) {
    return res.status(400).json({ error: 'language must be cpp, python, or java' });
  }

  try {
    let result;
    if (language === 'cpp')    result = await runCpp(code, input);
    else if (language === 'python') result = await runPython(code, input);
    else                        result = await runJava(code, input);

    if (result.error) return res.json({ error: result.error });
    return res.json({ output: result.output });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during execution' });
  }
});

module.exports = router;
