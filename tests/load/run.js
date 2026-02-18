#!/usr/bin/env node
/**
 * VastraVerse — k6 Load Test Orchestrator
 *
 * Called by npm scripts. Runs k6 with the correct flags,
 * then auto-generates the HTML report.
 *
 * Usage (via npm):
 *   npm run test:load
 *   npm run test:stress
 *   npm run test:spike
 *   npm run test:smoke
 *
 * Direct usage:
 *   node tests/load/run.js load
 *   node tests/load/run.js stress
 *   node tests/load/run.js spike [BASE_URL] [SESSION_COOKIE]
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mode = process.argv[2] || 'load';
const baseUrl = process.argv[3] || process.env.BASE_URL || 'https://vastraverse.in';
const sessionCookie = process.argv[4] || process.env.SESSION_COOKIE || '';
const productSlugs = process.env.PRODUCT_SLUGS || '';

const resultsDir = path.join(__dirname, 'results');
fs.mkdirSync(resultsDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const jsonOut = path.join(resultsDir, `${mode}-${timestamp}.json`);
const mainScript = path.join(__dirname, 'main.js');
const reportGen = path.join(__dirname, 'generate-report.js');

// ─── Resolve k6 binary ───────────────────────────────────────────────────────
function findK6() {
    // Try PATH first
    try { execSync('k6 version', { stdio: 'ignore' }); return 'k6'; } catch (_) { }
    // Windows default install location
    const winPath = 'C:\\Program Files\\k6\\k6.exe';
    if (fs.existsSync(winPath)) return `"${winPath}"`;
    // Mac/Linux homebrew
    const brewPath = '/usr/local/bin/k6';
    if (fs.existsSync(brewPath)) return brewPath;
    const brewPath2 = '/opt/homebrew/bin/k6';
    if (fs.existsSync(brewPath2)) return brewPath2;

    console.error('❌ k6 not found. Install it:');
    console.error('   Windows: winget install k6');
    console.error('   Mac:     brew install k6');
    console.error('   Linux:   sudo apt install k6');
    process.exit(1);
}

const k6 = findK6();

// ─── Build k6 command ────────────────────────────────────────────────────────
const envFlags = [
    `-e MODE=${mode}`,
    `-e BASE_URL=${baseUrl}`,
    `-e RESULT_FILE=${jsonOut}`,
    sessionCookie ? `-e SESSION_COOKIE="${sessionCookie}"` : '',
    productSlugs ? `-e PRODUCT_SLUGS="${productSlugs}"` : '',
].filter(Boolean).join(' ');

const cmd = `${k6} run ${envFlags} "${mainScript}"`;

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log(`║  VastraVerse Load Test — ${mode.toUpperCase().padEnd(28)}║`);
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`\n  Target:  ${baseUrl}`);
console.log(`  Mode:    ${mode}`);
console.log(`  Output:  ${jsonOut}`);
console.log(`\n  Running: ${cmd}\n`);

// ─── Run k6 ──────────────────────────────────────────────────────────────────
const result = spawnSync(cmd, {
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, BASE_URL: baseUrl, MODE: mode },
});

const exitCode = result.status ?? 1;

// ─── Generate HTML Report ─────────────────────────────────────────────────────
console.log('\n📊 Generating HTML report...');
try {
    execSync(`node "${reportGen}" "${jsonOut}"`, { stdio: 'inherit' });
} catch (e) {
    console.warn('⚠️  Report generation failed (test results still saved as JSON)');
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════╗');
if (exitCode === 0) {
    console.log('║  ✅ TEST PASSED — All thresholds met                 ║');
} else {
    console.log('║  ❌ TEST FAILED — One or more thresholds exceeded    ║');
}
console.log('╚══════════════════════════════════════════════════════╝\n');

process.exit(exitCode);
