#!/usr/bin/env node
/**
 * VastraVerse — k6 HTML Report Generator
 *
 * Reads the latest JSON result from tests/load/results/
 * and generates a rich HTML performance report.
 *
 * Usage (called by npm scripts automatically):
 *   node tests/load/generate-report.js [path/to/result.json]
 *
 * Or standalone:
 *   node tests/load/generate-report.js results/load-2024-01-15T10-30-00.json
 */

const fs = require('fs');
const path = require('path');

// ─── Find JSON result file ────────────────────────────────────────────────────
const resultsDir = path.join(__dirname, 'results');

function findLatestResult(explicitPath) {
    if (explicitPath && fs.existsSync(explicitPath)) return explicitPath;

    if (!fs.existsSync(resultsDir)) {
        console.error('❌ No results directory found. Run a load test first.');
        process.exit(1);
    }

    const files = fs.readdirSync(resultsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(resultsDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) {
        console.error('❌ No JSON result files found in results/. Run a load test first.');
        process.exit(1);
    }

    return path.join(resultsDir, files[0].name);
}

const resultFile = findLatestResult(process.argv[2]);
console.log(`📊 Generating report from: ${resultFile}`);

const data = JSON.parse(fs.readFileSync(resultFile, 'utf8'));

// ─── Extract Metrics ──────────────────────────────────────────────────────────
function getMetric(name) {
    return data.metrics?.[name] || null;
}

function fmtMs(ms) {
    if (ms == null) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function fmtRate(rate) {
    if (rate == null) return 'N/A';
    return `${(rate * 100).toFixed(2)}%`;
}

function statusBadge(value, goodThreshold, warnThreshold, isRate = false) {
    const v = isRate ? value * 100 : value;
    const good = isRate ? goodThreshold * 100 : goodThreshold;
    const warn = isRate ? warnThreshold * 100 : warnThreshold;
    if (v <= good) return '<span class="badge good">✅ Good</span>';
    if (v <= warn) return '<span class="badge warn">⚠️ Warning</span>';
    return '<span class="badge bad">❌ Critical</span>';
}

const httpDur = getMetric('http_req_duration');
const httpFailed = getMetric('http_req_failed');
const errors = getMetric('errors');
const totalReqs = getMetric('total_requests');
const failedReqs = getMetric('failed_requests');
const httpReqs = getMetric('http_reqs');

const pageMetrics = [
    { name: 'Homepage', key: 'homepage_duration', threshold: 2000 },
    { name: 'Product Listing', key: 'product_listing_duration', threshold: 2500 },
    { name: 'Product Page', key: 'product_page_duration', threshold: 2500 },
    { name: 'Checkout', key: 'checkout_duration', threshold: 3000 },
    { name: 'Payment Verify', key: 'payment_verify_duration', threshold: 3000 },
    { name: 'Admin Login', key: 'admin_login_duration', threshold: 2000 },
].map(m => ({ ...m, metric: getMetric(m.key) })).filter(m => m.metric);

// Determine overall status
const failRate = httpFailed?.values?.rate || 0;
const p95 = httpDur?.values?.['p(95)'] || 0;
const overallOk = failRate < 0.01 && p95 < 3000;
const overallWarn = failRate < 0.05 && p95 < 5000;
const overallStatus = overallOk ? '✅ PASSED' : overallWarn ? '⚠️ WARNING' : '❌ FAILED';
const overallClass = overallOk ? 'good' : overallWarn ? 'warn' : 'bad';

// Test metadata from tags
const mode = data.options?.tags?.mode || 'load';
const target = data.options?.tags?.target || 'https://vastraverse.in';
const runAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

// ─── HTML Template ────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VastraVerse Load Test Report — ${mode.toUpperCase()}</title>
<style>
  :root {
    --bg: #0f1117; --surface: #1a1d27; --surface2: #22263a;
    --border: #2d3148; --text: #e2e8f0; --muted: #8892a4;
    --good: #22c55e; --warn: #f59e0b; --bad: #ef4444;
    --accent: #6366f1; --accent2: #8b5cf6;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; padding: 2rem; }
  h1 { font-size: 1.8rem; font-weight: 700; background: linear-gradient(135deg, var(--accent), var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  h2 { font-size: 1.1rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
  .meta { color: var(--muted); font-size: 0.85rem; margin-top: 0.5rem; }
  .meta span { margin-right: 1.5rem; }
  .overall { padding: 0.5rem 1.2rem; border-radius: 8px; font-weight: 700; font-size: 1.1rem; }
  .overall.good { background: rgba(34,197,94,0.15); color: var(--good); border: 1px solid rgba(34,197,94,0.3); }
  .overall.warn { background: rgba(245,158,11,0.15); color: var(--warn); border: 1px solid rgba(245,158,11,0.3); }
  .overall.bad  { background: rgba(239,68,68,0.15);  color: var(--bad);  border: 1px solid rgba(239,68,68,0.3); }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
  .card .label { color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .card .value { font-size: 1.8rem; font-weight: 700; }
  .card .sub   { color: var(--muted); font-size: 0.8rem; margin-top: 0.25rem; }
  .card.good .value { color: var(--good); }
  .card.warn .value { color: var(--warn); }
  .card.bad  .value { color: var(--bad); }
  .section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; color: var(--muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
  td { padding: 0.75rem; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
  tr:last-child td { border-bottom: none; }
  .badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .badge.good { background: rgba(34,197,94,0.15);  color: var(--good); }
  .badge.warn { background: rgba(245,158,11,0.15); color: var(--warn); }
  .badge.bad  { background: rgba(239,68,68,0.15);  color: var(--bad); }
  .bar-wrap { background: var(--surface2); border-radius: 4px; height: 8px; overflow: hidden; margin-top: 0.5rem; }
  .bar { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .bar.good { background: var(--good); }
  .bar.warn { background: var(--warn); }
  .bar.bad  { background: var(--bad); }
  .thresholds { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }
  .threshold-item { background: var(--surface2); border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.85rem; }
  .threshold-item .th-label { color: var(--muted); font-size: 0.75rem; }
  footer { text-align: center; color: var(--muted); font-size: 0.8rem; margin-top: 2rem; }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>⚡ VastraVerse Load Test Report</h1>
    <div class="meta">
      <span>🎯 Mode: <strong>${mode.toUpperCase()}</strong></span>
      <span>🌐 Target: <strong>${target}</strong></span>
      <span>🕐 Run at: <strong>${runAt} IST</strong></span>
    </div>
  </div>
  <div class="overall ${overallClass}">${overallStatus}</div>
</div>

<!-- Key Metrics -->
<div class="grid">
  <div class="card ${failRate < 0.01 ? 'good' : failRate < 0.05 ? 'warn' : 'bad'}">
    <div class="label">Failure Rate</div>
    <div class="value">${fmtRate(failRate)}</div>
    <div class="sub">Target: &lt; 1%</div>
  </div>
  <div class="card ${p95 < 2000 ? 'good' : p95 < 3000 ? 'warn' : 'bad'}">
    <div class="label">p95 Response Time</div>
    <div class="value">${fmtMs(p95)}</div>
    <div class="sub">Target: &lt; 3000ms</div>
  </div>
  <div class="card">
    <div class="label">p99 Response Time</div>
    <div class="value">${fmtMs(httpDur?.values?.['p(99)'])}</div>
    <div class="sub">Target: &lt; 5000ms</div>
  </div>
  <div class="card">
    <div class="label">Avg Response Time</div>
    <div class="value">${fmtMs(httpDur?.values?.avg)}</div>
    <div class="sub">Min: ${fmtMs(httpDur?.values?.min)} / Max: ${fmtMs(httpDur?.values?.max)}</div>
  </div>
  <div class="card">
    <div class="label">Total Requests</div>
    <div class="value">${httpReqs?.values?.count?.toLocaleString() || 'N/A'}</div>
    <div class="sub">Rate: ${httpReqs?.values?.rate?.toFixed(1) || 'N/A'} req/s</div>
  </div>
  <div class="card ${failedReqs?.values?.count === 0 ? 'good' : 'bad'}">
    <div class="label">Failed Requests</div>
    <div class="value">${failedReqs?.values?.count?.toLocaleString() || '0'}</div>
    <div class="sub">Server errors (5xx)</div>
  </div>
</div>

<!-- Per-Page Breakdown -->
${pageMetrics.length > 0 ? `
<div class="section">
  <h2>Per-Page Latency Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Page / Endpoint</th>
        <th>Avg</th>
        <th>p95</th>
        <th>p99</th>
        <th>Max</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${pageMetrics.map(({ name, metric, threshold }) => {
    const avg = metric.values.avg;
    const p95v = metric.values['p(95)'];
    const p99v = metric.values['p(99)'];
    const maxv = metric.values.max;
    const ok = p95v < threshold;
    const warn = p95v < threshold * 1.5;
    const cls = ok ? 'good' : warn ? 'warn' : 'bad';
    const barPct = Math.min(100, (p95v / (threshold * 2)) * 100).toFixed(0);
    return `
      <tr>
        <td><strong>${name}</strong>
          <div class="bar-wrap"><div class="bar ${cls}" style="width:${barPct}%"></div></div>
        </td>
        <td>${fmtMs(avg)}</td>
        <td><strong>${fmtMs(p95v)}</strong></td>
        <td>${fmtMs(p99v)}</td>
        <td>${fmtMs(maxv)}</td>
        <td>${statusBadge(p95v, threshold, threshold * 1.5)}</td>
      </tr>`;
}).join('')}
    </tbody>
  </table>
</div>
` : ''}

<!-- HTTP Stats -->
<div class="section">
  <h2>HTTP Statistics</h2>
  <table>
    <thead>
      <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>http_req_duration avg</td>
        <td>${fmtMs(httpDur?.values?.avg)}</td>
        <td>—</td>
        <td>—</td>
      </tr>
      <tr>
        <td>http_req_duration p95</td>
        <td><strong>${fmtMs(httpDur?.values?.['p(95)'])}</strong></td>
        <td>&lt; 3000ms</td>
        <td>${statusBadge(httpDur?.values?.['p(95)'] || 0, 3000, 5000)}</td>
      </tr>
      <tr>
        <td>http_req_duration p99</td>
        <td><strong>${fmtMs(httpDur?.values?.['p(99)'])}</strong></td>
        <td>&lt; 5000ms</td>
        <td>${statusBadge(httpDur?.values?.['p(99)'] || 0, 5000, 8000)}</td>
      </tr>
      <tr>
        <td>http_req_failed</td>
        <td>${fmtRate(httpFailed?.values?.rate)}</td>
        <td>&lt; 1%</td>
        <td>${statusBadge(httpFailed?.values?.rate || 0, 0.01, 0.05, true)}</td>
      </tr>
      <tr>
        <td>http_req_blocked (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_blocked?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
      <tr>
        <td>http_req_connecting (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_connecting?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
      <tr>
        <td>http_req_tls_handshaking (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_tls_handshaking?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
      <tr>
        <td>http_req_sending (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_sending?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
      <tr>
        <td>http_req_waiting (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_waiting?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
      <tr>
        <td>http_req_receiving (avg)</td>
        <td>${fmtMs(data.metrics?.http_req_receiving?.values?.avg)}</td>
        <td>—</td><td>—</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Thresholds -->
${data.metrics ? `
<div class="section">
  <h2>Threshold Results</h2>
  <div class="thresholds">
    ${Object.entries(data.metrics)
            .filter(([, m]) => m.thresholds)
            .flatMap(([name, m]) =>
                Object.entries(m.thresholds).map(([expr, passed]) => `
        <div class="threshold-item">
          <div class="th-label">${name}</div>
          <div>${passed ? '✅' : '❌'} ${expr}</div>
        </div>`)
            ).join('')}
  </div>
</div>
` : ''}

<footer>
  Generated by VastraVerse Load Test Suite • ${new Date().toISOString()}
</footer>

</body>
</html>`;

// ─── Write HTML Report ────────────────────────────────────────────────────────
const reportName = path.basename(resultFile, '.json') + '.html';
const reportPath = path.join(resultsDir, reportName);

fs.mkdirSync(resultsDir, { recursive: true });
fs.writeFileSync(reportPath, html);

console.log(`✅ HTML report generated: ${reportPath}`);
console.log(`   Open in browser: file://${reportPath.replace(/\\/g, '/')}`);
