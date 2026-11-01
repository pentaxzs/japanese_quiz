#!/usr/bin/env node
/**
 * app/globals.css 의 팔레트를 읽어 WCAG AA 대비를 검증한다.
 *
 * 왜 필요한가: 이전 구현은 primary 가 배경 위에서 읽히는지만 확인하고
 * 버튼이 실제로 쓰는 조합(흰 글자 on primary)은 검증한 적이 없었다.
 * 그래서 2.6:1 짜리 버튼이 출시됐다. 사람이 계산기를 두드리는 대신
 * 쓰이는 조합 전부를 기계가 확인한다.
 *
 *   node scripts/check-contrast.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'app/globals.css'), 'utf8');

/** 본문 4.5:1, 큰 글씨·UI 그래픽 3:1 */
const AA_TEXT = 4.5;
const AA_LARGE = 3;

/** 검사할 조합: [전경 토큰, 배경 토큰, 최소비율, 어디에 쓰이는지] */
const PAIRS = [
  ['foreground', 'background', AA_TEXT, '본문'],
  ['muted-foreground', 'background', AA_TEXT, '보조 텍스트'],
  ['muted-foreground', 'card', AA_TEXT, '카드 위 보조 텍스트'],
  ['card-foreground', 'card', AA_TEXT, '카드 본문'],
  ['foreground', 'muted', AA_TEXT, 'muted 표면 위 본문'],
  ['accent-foreground', 'accent', AA_TEXT, 'accent 표면 위 텍스트'],
  ['primary-foreground', 'primary', AA_TEXT, '기본 버튼 글자'],
  ['primary', 'background', AA_LARGE, '기본 버튼 면'],
  ['mark-foreground', 'mark', AA_TEXT, '강조 버튼 글자 · 암기 시트 글자'],
  ['mark', 'background', AA_LARGE, '강조 그래픽·외곽선'],
  ['mark', 'card', AA_LARGE, '카드 위 강조 그래픽'],
  ['destructive-foreground', 'destructive', AA_TEXT, '삭제 버튼 글자'],
  ['destructive', 'background', AA_LARGE, '삭제 버튼 면'],
  ['destructive', 'card', AA_TEXT, '카드 위 경고 텍스트'],
  ['success', 'background', AA_LARGE, '정답 표시'],
  ['success', 'card', AA_TEXT, '카드 위 정답 텍스트'],
  ['ring', 'background', AA_LARGE, '포커스 링'],
  ['ring', 'card', AA_LARGE, '카드 위 포커스 링'],
  ['border', 'background', 1.2, '경계선(가시성 최소)'],
];

function srgb(c) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** `selector { --token: #hex; ... }` 블록을 전부 뽑는다 */
function parsePalettes(source) {
  const palettes = new Map();
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = blockRe.exec(source)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    if (!selector.includes('data-palette') && selector !== ':root') continue;
    const tokens = {};
    for (const [, name, value] of match[2].matchAll(/--([a-z-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
      tokens[name] = value;
    }
    if (Object.keys(tokens).length === 0) continue;
    // `:root, [data-palette="sumi"]` 처럼 묶인 선택자는 마지막 이름으로 대표시킨다
    const name = selector
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.includes('data-palette'))
      .map((s) => {
        const id = /data-palette="([^"]+)"/.exec(s)?.[1] ?? '?';
        return s.includes('.dark') ? `${id} / dark` : `${id} / light`;
      })
      .pop();
    if (!name) continue;
    palettes.set(name, tokens);
  }
  return palettes;
}

const palettes = parsePalettes(css);

if (palettes.size === 0) {
  console.error('globals.css 에서 팔레트를 찾지 못했습니다.');
  process.exit(1);
}

let failures = 0;
let checks = 0;
const missing = [];

for (const [name, tokens] of palettes) {
  const rows = [];
  for (const [fg, bg, need, where] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      missing.push(`${name}: --${tokens[fg] ? bg : fg} 토큰 없음`);
      continue;
    }
    const r = ratio(tokens[fg], tokens[bg]);
    const ok = r >= need;
    checks += 1;
    if (!ok) failures += 1;
    rows.push({ ok, r, need, where, fg, bg, fgv: tokens[fg], bgv: tokens[bg] });
  }
  const bad = rows.filter((r) => !r.ok);
  const head = bad.length === 0 ? '  OK ' : ' FAIL';
  console.log(`\n${head}  ${name}  (${rows.length}개 조합)`);
  for (const r of bad) {
    console.log(
      `       ${r.r.toFixed(2)}:1 < ${r.need}  ${r.where}` +
        `  --${r.fg} ${r.fgv} on --${r.bg} ${r.bgv}`
    );
  }
}

if (missing.length) {
  console.log('\n누락된 토큰:');
  for (const m of missing) console.log('  ' + m);
}

console.log(
  `\n팔레트 ${palettes.size}벌 · 조합 ${checks}건 검사 — ` +
    (failures === 0 ? '전부 통과' : `${failures}건 실패`)
);

process.exit(failures === 0 && missing.length === 0 ? 0 : 1);
