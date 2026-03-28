#!/usr/bin/env node

/**
 * Merge coverage reports from all packages into a single report
 * 
 * Usage: node scripts/merge-coverage.js
 * 
 * Outputs:
 * - coverage/merged/coverage-summary.json
 * - coverage/merged/index.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const COVERAGE_DIR = path.join(ROOT_DIR, 'coverage');
const MERGED_DIR = path.join(COVERAGE_DIR, 'merged');

// Packages to collect coverage from
const PACKAGES = [
  'build-scripts',
  'cli',
  'collections',
  'core',
  'icons',
  'maplibre',
  'mcp',
  'nextjs',
  'themes',
  'types',
  'ui-shadcn',
];

/**
 * Read coverage-summary.json from a package
 */
function readCoverageSummary(packageName) {
  const summaryPath = path.join(
    ROOT_DIR,
    'packages',
    packageName,
    'coverage',
    'coverage-summary.json'
  );

  if (!fs.existsSync(summaryPath)) {
    console.log(`⚠️  No coverage found for @stackwright/${packageName}`);
    return null;
  }

  try {
    const content = fs.readFileSync(summaryPath, 'utf-8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    console.error(`❌ Failed to read coverage for ${packageName}:`, error.message);
    return null;
  }
}

/**
 * Calculate aggregate coverage from all packages
 */
function mergeCoverage(coverageData) {
  const totals = {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
  };

  const byPackage = {};

  for (const [packageName, data] of Object.entries(coverageData)) {
    if (!data || !data.total) continue;

    const pkgTotal = data.total;
    byPackage[packageName] = pkgTotal;

    // Aggregate totals
    for (const metric of ['lines', 'statements', 'functions', 'branches']) {
      totals[metric].total += pkgTotal[metric].total || 0;
      totals[metric].covered += pkgTotal[metric].covered || 0;
      totals[metric].skipped += pkgTotal[metric].skipped || 0;
    }
  }

  // Calculate percentages
  for (const metric of ['lines', 'statements', 'functions', 'branches']) {
    if (totals[metric].total > 0) {
      totals[metric].pct = 
        (totals[metric].covered / totals[metric].total) * 100;
    }
  }

  return { totals, byPackage };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(merged) {
  const { totals, byPackage } = merged;

  const getColorClass = (pct) => {
    if (pct >= 80) return '#4caf50'; // green
    if (pct >= 60) return '#ff9800'; // orange
    return '#f44336'; // red
  };

  const formatPct = (pct) => pct.toFixed(2) + '%';

  const packageRows = Object.entries(byPackage)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pkg, data]) => `
      <tr>
        <td><strong>@stackwright/${pkg}</strong></td>
        <td style="color: ${getColorClass(data.lines.pct)}">${formatPct(data.lines.pct)}</td>
        <td style="color: ${getColorClass(data.statements.pct)}">${formatPct(data.statements.pct)}</td>
        <td style="color: ${getColorClass(data.functions.pct)}">${formatPct(data.functions.pct)}</td>
        <td style="color: ${getColorClass(data.branches.pct)}">${formatPct(data.branches.pct)}</td>
      </tr>
    `)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stackwright Coverage Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 0 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .totals {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 24px 0;
    }
    .metric-card {
      padding: 16px;
      border-radius: 8px;
      background: #f9f9f9;
      border-left: 4px solid;
    }
    .metric-card h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
    }
    .metric-card .value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .metric-card .details {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      font-size: 12px;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .timestamp {
      font-size: 14px;
      color: #666;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Stackwright Coverage Report</h1>
    
    <div class="totals">
      <div class="metric-card" style="border-color: ${getColorClass(totals.lines.pct)}">
        <h3>Lines</h3>
        <p class="value" style="color: ${getColorClass(totals.lines.pct)}">${formatPct(totals.lines.pct)}</p>
        <p class="details">${totals.lines.covered} / ${totals.lines.total}</p>
      </div>
      
      <div class="metric-card" style="border-color: ${getColorClass(totals.statements.pct)}">
        <h3>Statements</h3>
        <p class="value" style="color: ${getColorClass(totals.statements.pct)}">${formatPct(totals.statements.pct)}</p>
        <p class="details">${totals.statements.covered} / ${totals.statements.total}</p>
      </div>
      
      <div class="metric-card" style="border-color: ${getColorClass(totals.functions.pct)}">
        <h3>Functions</h3>
        <p class="value" style="color: ${getColorClass(totals.functions.pct)}">${formatPct(totals.functions.pct)}</p>
        <p class="details">${totals.functions.covered} / ${totals.functions.total}</p>
      </div>
      
      <div class="metric-card" style="border-color: ${getColorClass(totals.branches.pct)}">
        <h3>Branches</h3>
        <p class="value" style="color: ${getColorClass(totals.branches.pct)}">${formatPct(totals.branches.pct)}</p>
        <p class="details">${totals.branches.covered} / ${totals.branches.total}</p>
      </div>
    </div>

    <h2>Coverage by Package</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Lines</th>
          <th>Statements</th>
          <th>Functions</th>
          <th>Branches</th>
        </tr>
      </thead>
      <tbody>
        ${packageRows}
      </tbody>
    </table>

    <p class="timestamp">Generated: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Main execution
 */
function main() {
  console.log('🐕 Merging coverage reports from all packages...\n');

  // Ensure merged directory exists
  if (!fs.existsSync(MERGED_DIR)) {
    fs.mkdirSync(MERGED_DIR, { recursive: true });
  }

  // Collect coverage from all packages
  const coverageData = {};
  for (const pkg of PACKAGES) {
    const summary = readCoverageSummary(pkg);
    if (summary) {
      coverageData[pkg] = summary;
      console.log(`✅ Loaded coverage for @stackwright/${pkg}`);
    }
  }

  if (Object.keys(coverageData).length === 0) {
    console.error('\n❌ No coverage data found! Run tests first with coverage enabled.');
    process.exit(1);
  }

  // Merge coverage
  const merged = mergeCoverage(coverageData);

  // Write merged summary JSON
  const summaryPath = path.join(MERGED_DIR, 'coverage-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(merged, null, 2));
  console.log(`\n📊 Merged coverage summary: ${summaryPath}`);

  // Generate HTML report
  const html = generateHTMLReport(merged);
  const htmlPath = path.join(MERGED_DIR, 'index.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`📊 HTML report: ${htmlPath}`);

  // Print summary
  console.log('\n🎯 Overall Coverage:');
  console.log(`   Lines:      ${merged.totals.lines.pct.toFixed(2)}%`);
  console.log(`   Statements: ${merged.totals.statements.pct.toFixed(2)}%`);
  console.log(`   Functions:  ${merged.totals.functions.pct.toFixed(2)}%`);
  console.log(`   Branches:   ${merged.totals.branches.pct.toFixed(2)}%`);
  console.log('');
}

main();
