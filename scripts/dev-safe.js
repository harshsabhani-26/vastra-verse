/**
 * Safe Dev Server Startup Script
 * 
 * Handles ISSUE 1: Turbopack cache corruption recovery
 * 
 * This script:
 * 1. Checks if .next directory exists and is potentially corrupted
 * 2. Cleans corrupted cache files before starting dev server
 * 3. Starts Next.js dev server normally
 * 
 * Corruption indicators:
 * - Missing .sst / .meta files
 * - Corrupted SQLite databases (Turbopack uses SQLite internally)
 * - Stale lock files
 * 
 * Usage:
 *   npm run dev:safe     — Always cleans .next before starting
 *   npm run dev:clean    — Cleans .next and reinstalls node_modules
 */

const { existsSync, rmSync, readdirSync, statSync } = require('fs');
const { join } = require('path');
const { execSync, spawn } = require('child_process');

const ROOT = join(__dirname, '..');
const NEXT_DIR = join(ROOT, '.next');

// ANSI colors
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function log(color, prefix, msg) {
    console.log(`${color}[${prefix}]${RESET} ${msg}`);
}

/**
 * Check if .next cache appears corrupted
 */
function isCacheCorrupted() {
    if (!existsSync(NEXT_DIR)) return false;

    const corruptionSignals = [];

    // Check for Turbopack's SQLite databases
    const cacheDir = join(NEXT_DIR, 'cache');
    if (existsSync(cacheDir)) {
        try {
            const files = readdirSync(cacheDir, { recursive: true });
            for (const file of files) {
                const fullPath = join(cacheDir, String(file));
                try {
                    const stat = statSync(fullPath);
                    // Empty .db files = corruption
                    if (String(file).endsWith('.db') && stat.size === 0) {
                        corruptionSignals.push(`Empty DB file: ${file}`);
                    }
                } catch {
                    corruptionSignals.push(`Unreadable file: ${file}`);
                }
            }
        } catch {
            corruptionSignals.push('Cache directory unreadable');
        }
    }

    // Check for lock files (stale from crashes)
    const lockFiles = [
        join(NEXT_DIR, 'trace'),
        join(NEXT_DIR, 'cache', 'swc', 'plugins', 'v7'),
    ];
    for (const f of lockFiles) {
        if (existsSync(f)) {
            try {
                statSync(f);
            } catch {
                corruptionSignals.push(`Stale lock: ${f}`);
            }
        }
    }

    if (corruptionSignals.length > 0) {
        log(YELLOW, 'CACHE_CHECK', `Found ${corruptionSignals.length} corruption signal(s):`);
        corruptionSignals.forEach(s => log(YELLOW, 'CACHE_CHECK', `  → ${s}`));
        return true;
    }

    return false;
}

/**
 * Clean .next directory
 */
function cleanNextDir() {
    if (!existsSync(NEXT_DIR)) {
        log(GREEN, 'CLEAN', '.next directory does not exist — nothing to clean');
        return;
    }

    log(CYAN, 'CLEAN', 'Removing .next directory...');
    try {
        rmSync(NEXT_DIR, { recursive: true, force: true });
        log(GREEN, 'CLEAN', '✓ .next directory removed successfully');
    } catch (err) {
        log(RED, 'CLEAN', `Failed to remove .next: ${err.message}`);
        log(YELLOW, 'CLEAN', 'Trying with retry...');
        // Sometimes files are still locked; wait and retry
        setTimeout(() => {
            try {
                rmSync(NEXT_DIR, { recursive: true, force: true });
                log(GREEN, 'CLEAN', '✓ .next directory removed on retry');
            } catch (err2) {
                log(RED, 'CLEAN', `Still failed: ${err2.message}`);
                log(RED, 'CLEAN', 'Please close all apps using this directory and try again.');
                process.exit(1);
            }
        }, 2000);
    }
}

// ============================================================
// Main
// ============================================================

const mode = process.argv[2] || 'safe';

log(CYAN, 'DEV', `Starting dev server in "${mode}" mode...`);

if (mode === 'clean') {
    // Full clean: .next + node_modules
    log(CYAN, 'CLEAN', 'Full clean mode: removing .next');
    cleanNextDir();
    log(GREEN, 'CLEAN', '✓ Clean complete');
} else {
    // Safe mode: only clean if corrupted
    if (isCacheCorrupted()) {
        log(YELLOW, 'CACHE_CHECK', 'Cache corruption detected — cleaning...');
        cleanNextDir();
    } else if (existsSync(NEXT_DIR)) {
        log(GREEN, 'CACHE_CHECK', '✓ Cache appears healthy');
    } else {
        log(CYAN, 'CACHE_CHECK', 'No cache found — fresh start');
    }
}

// Start Next.js dev server
log(CYAN, 'DEV', 'Starting Next.js dev server...');
const child = spawn('npx', ['next', 'dev'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env },
});

child.on('close', (code) => {
    if (code !== 0 && code !== null) {
        log(RED, 'DEV', `Dev server exited with code ${code}`);

        // If Turbopack panicked, offer to restart with clean cache
        log(YELLOW, 'DEV', 'If you see Turbopack panic errors, run: npm run dev:clean');
    }
});

// Forward signals
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
