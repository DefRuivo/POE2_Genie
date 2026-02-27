import fs from 'fs';

type FileCoverage = {
  lf: number;
  lh: number;
  brf: number;
  brh: number;
  fnf: number;
  fnh: number;
  file: string;
};

function parseLcov(content: string): FileCoverage[] {
  const lines = content.split('\n');
  const records: FileCoverage[] = [];
  let current: FileCoverage | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('SF:')) {
      current = {
        file: line.slice(3),
        lf: 0,
        lh: 0,
        brf: 0,
        brh: 0,
        fnf: 0,
        fnh: 0,
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('LF:')) current.lf = Number(line.slice(3));
    else if (line.startsWith('LH:')) current.lh = Number(line.slice(3));
    else if (line.startsWith('BRF:')) current.brf = Number(line.slice(4));
    else if (line.startsWith('BRH:')) current.brh = Number(line.slice(4));
    else if (line.startsWith('FNF:')) current.fnf = Number(line.slice(4));
    else if (line.startsWith('FNH:')) current.fnh = Number(line.slice(4));
    else if (line === 'end_of_record') {
      records.push(current);
      current = null;
    }
  }

  return records;
}

function pct(covered: number, total: number): number {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

function main() {
  const lcovPath = 'coverage/lcov.info';
  if (!fs.existsSync(lcovPath)) {
    console.error('coverage/lcov.info not found. Run coverage first.');
    process.exit(1);
  }

  const content = fs.readFileSync(lcovPath, 'utf8');
  const records = parseLcov(content);
  const cwdPrefix = `${process.cwd()}/`;

  let totalLines = 0;
  let coveredLines = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;

  const ranked = records.map((record) => {
    totalLines += record.lf;
    coveredLines += record.lh;
    totalBranches += record.brf;
    coveredBranches += record.brh;
    totalFunctions += record.fnf;
    coveredFunctions += record.fnh;

    const uncoveredLines = record.lf - record.lh;
    const uncoveredBranches = record.brf - record.brh;
    const uncoveredFunctions = record.fnf - record.fnh;
    const uncoveredScore = uncoveredLines + uncoveredBranches + uncoveredFunctions;

    return {
      file: record.file.replace(cwdPrefix, ''),
      linePct: pct(record.lh, record.lf),
      branchPct: pct(record.brh, record.brf),
      functionPct: pct(record.fnh, record.fnf),
      uncoveredLines,
      uncoveredBranches,
      uncoveredFunctions,
      uncoveredScore,
    };
  });

  ranked.sort((a, b) => b.uncoveredScore - a.uncoveredScore);

  console.log('=== Coverage Summary ===');
  console.log(`Lines: ${coveredLines}/${totalLines} (${pct(coveredLines, totalLines).toFixed(2)}%)`);
  console.log(`Branches: ${coveredBranches}/${totalBranches} (${pct(coveredBranches, totalBranches).toFixed(2)}%)`);
  console.log(`Functions: ${coveredFunctions}/${totalFunctions} (${pct(coveredFunctions, totalFunctions).toFixed(2)}%)`);
  console.log('');
  console.log('=== Top 20 Gaps (lines+branches+functions uncovered) ===');

  for (const row of ranked.slice(0, 20)) {
    console.log(
      `${row.file} | L ${row.linePct.toFixed(1)}% | B ${row.branchPct.toFixed(1)}% | F ${row.functionPct.toFixed(1)}%` +
      ` | uncov: lines=${row.uncoveredLines}, branches=${row.uncoveredBranches}, functions=${row.uncoveredFunctions}`,
    );
  }
}

main();
