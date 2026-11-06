import { CopticReadings } from 'coptic-readings'
import { getBibleText } from 'bible-citation-text'

export const DEMOS = [
  {
    id: 'readings',
    label: 'coptic-readings',
    blurb: 'Feast, tune, and liturgy refs for a date.',
  },
  {
    id: 'citation',
    label: 'bible-citation-text',
    blurb: 'Resolve a citation into English / Arabic text.',
  },
  {
    id: 'together',
    label: 'Together',
    blurb: 'Day gospel from readings → verse text.',
  },
]

export const FORMATS = [
  { id: 'mjs', label: '.mjs', ext: 'mjs' },
  { id: 'cjs', label: '.cjs', ext: 'cjs' },
]

const SNIPPETS = {
  readings: {
    mjs: `import { CopticReadings } from 'coptic-readings';

const day = new CopticReadings(new Date(2026, 3, 12));

console.log(day.feast);
console.log(day.copticDate);
console.log(day.readingReference.ref?.liturgy);`,
    cjs: `const { CopticReadings } = require('coptic-readings');

const day = new CopticReadings(new Date(2026, 3, 12));

console.log(day.feast);
console.log(day.copticDate);
console.log(day.readingReference.ref?.liturgy);`,
  },
  citation: {
    mjs: `import { getBibleText } from 'bible-citation-text';

const text = await getBibleText('John 20:1-10', {
  langs: ['en', 'ar'],
  cache: true,
});

console.log(text.en);
console.log(text.versesAr?.slice(0, 3));`,
    cjs: `const { getBibleText } = require('bible-citation-text');

async function main() {
  const text = await getBibleText('John 20:1-10', {
    langs: ['en', 'ar'],
    cache: true,
  });

  console.log(text.en);
  console.log(text.versesAr?.slice(0, 3));
}

main();`,
  },
  together: {
    mjs: `import { CopticReadings } from 'coptic-readings';
import { getBibleText } from 'bible-citation-text';

const day = new CopticReadings(new Date(2026, 3, 12));
const gospel = day.readingReference.ref?.liturgy?.gospel;

console.log('Gospel citation:', gospel);

const text = await getBibleText(gospel, { langs: ['en'], cache: true });
console.log(text.en);`,
    cjs: `const { CopticReadings } = require('coptic-readings');
const { getBibleText } = require('bible-citation-text');

async function main() {
  const day = new CopticReadings(new Date(2026, 3, 12));
  const gospel = day.readingReference.ref?.liturgy?.gospel;

  console.log('Gospel citation:', gospel);

  const text = await getBibleText(gospel, { langs: ['en'], cache: true });
  console.log(text.en);
}

main();`,
  },
}

export function getSnippet(demoId, formatId) {
  return SNIPPETS[demoId]?.[formatId] ?? SNIPPETS.readings.mjs
}

function formatValue(value) {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** Strip import/require so the body can run with injected APIs. */
export function prepareSource(source) {
  let body = source
    .replace(/^\s*import\s+.+?\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/^\s*const\s+\{[^}]+\}\s*=\s*require\(['"][^'"]+['"]\)\s*;?\s*$/gm, '')
    .trim()

  const mainWrapped = body.match(
    /^async\s+function\s+main\s*\(\s*\)\s*\{([\s\S]*)\}\s*(?:main\s*\(\s*\)\s*;?\s*)?$/,
  )
  if (mainWrapped) body = mainWrapped[1].trim()

  return body
}

export async function runPlayground(source) {
  const lines = []
  const fakeConsole = {
    log(...args) {
      lines.push(args.map(formatValue).join(' '))
    },
    info(...args) {
      lines.push(args.map(formatValue).join(' '))
    },
    warn(...args) {
      lines.push(`[warn] ${args.map(formatValue).join(' ')}`)
    },
    error(...args) {
      lines.push(`[error] ${args.map(formatValue).join(' ')}`)
    },
  }

  const body = prepareSource(source)
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

  try {
    const fn = new AsyncFunction(
      'CopticReadings',
      'getBibleText',
      'console',
      `"use strict";\n${body}`,
    )
    await fn(CopticReadings, getBibleText, fakeConsole)
    return {
      ok: true,
      output: lines.length ? lines.join('\n\n') : '(no console output)',
    }
  } catch (err) {
    return {
      ok: false,
      output: err?.stack || err?.message || String(err),
    }
  }
}
