// 이미지 최적화: public/ 내 큰 png/jpg를 리사이즈+재압축 (경로/확장자 유지)
// 실행: node scripts/optimize-images.mjs
import sharp from "sharp";
import { readdir, stat, rename } from "fs/promises";
import { join, extname } from "path";

const ROOTS = ["public/images", "public/thumbnails"];
const SINGLE = ["public/hero-logo.png", "public/og-default.png"];
const MAX_W = 1280;          // 표시 최대폭 기준 (retina 여유 포함)
const MIN_BYTES = 150 * 1024; // 150KB 이상만 처리
const JPG_Q = 80;
const PNG_Q = 78;

let processed = 0, before = 0, after = 0, skipped = 0, failed = 0;

async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return []; }
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(p));
    else files.push(p);
  }
  return files;
}

async function optimize(file) {
  const ext = extname(file).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return;
  let s;
  try { s = await stat(file); } catch { return; }
  if (s.size < MIN_BYTES) { skipped++; return; }

  const tmp = file + ".opt";
  try {
    const img = sharp(file, { failOn: "none" });
    const meta = await img.metadata();
    let pipe = img.rotate(); // EXIF 방향 보정
    if (meta.width && meta.width > MAX_W) {
      pipe = pipe.resize({ width: MAX_W, withoutEnlargement: true });
    }
    if (ext === ".png") pipe = pipe.png({ quality: PNG_Q, compressionLevel: 9, palette: true, effort: 7 });
    else if (ext === ".webp") pipe = pipe.webp({ quality: JPG_Q });
    else pipe = pipe.jpeg({ quality: JPG_Q, mozjpeg: true });

    await pipe.toFile(tmp);
    const ns = await stat(tmp);

    // 더 작아진 경우에만 교체
    if (ns.size < s.size) {
      await rename(tmp, file);
      before += s.size; after += ns.size; processed++;
    } else {
      const { unlink } = await import("fs/promises");
      await unlink(tmp).catch(() => {});
      skipped++;
    }
  } catch (e) {
    failed++;
    const { unlink } = await import("fs/promises");
    await unlink(tmp).catch(() => {});
  }
}

const all = [];
for (const r of ROOTS) all.push(...await walk(r));
all.push(...SINGLE);

console.log(`대상 후보: ${all.length}개 파일`);
let i = 0;
for (const f of all) {
  await optimize(f);
  if (++i % 50 === 0) console.log(`  ...${i}/${all.length} 처리 중 (압축 ${processed})`);
}

const mb = (b) => (b / 1024 / 1024).toFixed(1) + "MB";
console.log(`\n=== 완료 ===`);
console.log(`압축됨: ${processed}개 | 건너뜀: ${skipped} | 실패: ${failed}`);
console.log(`크기: ${mb(before)} → ${mb(after)} (절감 ${mb(before - after)})`);
