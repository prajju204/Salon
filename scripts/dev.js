#!/usr/bin/env node
/**
 * scripts/dev.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Smart Vite dev launcher for Windows + React + Vite.
 *
 * What it does:
 *  1. Checks if the preferred port (5173) is in use.
 *  2. If occupied by a stale Vite / Node dev process → kills it cleanly.
 *  3. If occupied by something else → scans 5174, 5175 … until a free port
 *     is found (and tells you about the switch).
 *  4. Launches `vite --port <port>` and prints a clear startup banner.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { createServer } from 'net';
import { execSync, spawn } from 'child_process';

const PREFERRED_PORT = 5173;
const MAX_PORT = 5200; // scan up to this port before giving up

// ── ANSI colours (work in Windows Terminal / PowerShell 7) ──────────────────
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + c.reset);
}

// ── Port helpers ─────────────────────────────────────────────────────────────

/** Returns true if `port` has no listener */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

/** Returns the first free port starting from `start` */
async function findFreePort(start) {
  for (let port = start; port <= MAX_PORT; port++) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free port found between ${start} and ${MAX_PORT}`);
}

// ── Process helpers (Windows) ─────────────────────────────────────────────────

/**
 * Returns the PID of whatever is LISTENING on `port`, or null.
 * Uses `netstat -ano` which is available on all Windows versions.
 */
function getPidOnPort(port) {
  try {
    const out = execSync('netstat -ano', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      // Match lines like:  TCP  [::1]:5173  ...  LISTENING  1234
      if (line.includes(`:${port}`) && line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(pid) && pid > 0) return pid;
      }
    }
  } catch {
    /* netstat not available or failed — ignore */
  }
  return null;
}

/**
 * Returns the command line of a process by PID (so we can confirm it is a
 * dev process before killing it).
 */
function getProcessCommandLine(pid) {
  try {
    const out = execSync(
      `wmic process where "ProcessId=${pid}" get CommandLine /format:list`,
      { encoding: 'utf8' }
    );
    return out;
  } catch {
    return '';
  }
}

/** Returns true if the command line looks like a Vite / Node dev process */
function isDevProcess(cmdLine) {
  const lower = cmdLine.toLowerCase();
  return (
    lower.includes('vite') ||
    (lower.includes('node') && lower.includes('dev'))
  );
}

/** Kills a process by PID. Returns true on success. */
function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
    return true;
  } catch {
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  log(c.bold + c.magenta, '══════════════════════════════════════════════');
  log(c.bold + c.magenta, '  💈  Luxe Groom — Dev Server Launcher');
  log(c.bold + c.magenta, '══════════════════════════════════════════════');
  console.log('');

  let targetPort = PREFERRED_PORT;
  let portChanged = false;

  const portFree = await isPortFree(PREFERRED_PORT);

  if (!portFree) {
    const pid = getPidOnPort(PREFERRED_PORT);
    log(c.yellow, `⚠  Port ${PREFERRED_PORT} is in use${pid ? ` (PID ${pid})` : ''}.`);

    if (pid) {
      const cmd = getProcessCommandLine(pid);
      if (isDevProcess(cmd)) {
        log(c.yellow, `   └─ Stale dev process detected — terminating PID ${pid}...`);
        const killed = killPid(pid);
        if (killed) {
          log(c.green, `   └─ ✔  PID ${pid} terminated successfully.`);
          // Give OS a moment to release the port
          await new Promise((r) => setTimeout(r, 600));
          targetPort = PREFERRED_PORT; // reclaim the same port
        } else {
          log(c.red, `   └─ ✘  Failed to terminate PID ${pid}. Searching for a free port...`);
          targetPort = await findFreePort(PREFERRED_PORT + 1);
          portChanged = true;
        }
      } else {
        log(c.gray, `   └─ Non-dev process on port ${PREFERRED_PORT} — switching to next free port...`);
        targetPort = await findFreePort(PREFERRED_PORT + 1);
        portChanged = true;
      }
    } else {
      log(c.gray, `   └─ No PID resolved — searching for a free port...`);
      targetPort = await findFreePort(PREFERRED_PORT + 1);
      portChanged = true;
    }
  }

  // Confirm the chosen port is actually free now
  const chosen = await findFreePort(targetPort);
  if (chosen !== targetPort) {
    portChanged = true;
    targetPort = chosen;
  }

  console.log('');
  if (portChanged) {
    log(c.yellow, `🔄  Port changed: ${PREFERRED_PORT} → ${targetPort}`);
  }
  log(c.green, `🚀  Starting Vite on port ${targetPort}...`);
  log(c.cyan, `🌐  Local URL : http://localhost:${targetPort}/`);
  console.log('');

  // ── Launch Vite ────────────────────────────────────────────────────────────
  const vite = spawn(
    'npx',
    ['vite', '--port', String(targetPort)],
    {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_DEV_PORT: String(targetPort),
        FORCE_COLOR: '1',
      },
    }
  );

  vite.on('error', (err) => {
    log(c.red, `✘  Failed to start Vite: ${err.message}`);
    process.exit(1);
  });

  vite.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  // Forward signals so Ctrl+C cleanly stops Vite
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
      vite.kill(sig);
    });
  }
}

main().catch((err) => {
  console.error(c.red + '✘  Dev launcher error: ' + err.message + c.reset);
  process.exit(1);
});
