// node:test 에서 앱 소스를 그대로 불러오기 위한 resolve 훅 (월드맵 전용).
//
// 앱 코드는 `./types` 처럼 확장자 없이 import 하고 `@/lib/...` 별칭도 쓴다.
// Node 의 ESM 해석기는 둘 다 모르므로 여기서 실제 파일로 이어준다. 앱 번들에는 영향이 없다.
//
// ※ tests/emulator/alias-hooks.mjs 는 보상 릴리스가 쓰고 있어 건드리지 않는다.

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

function firstExisting(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mjs`, `${base}.js`, path.join(base, "index.ts")];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // "@/lib/worldmap/types" → <root>/lib/worldmap/types.ts
  if (specifier.startsWith("@/")) {
    const resolved = firstExisting(path.join(ROOT, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  // "./types" → 같은 폴더의 types.ts
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier)) {
    const parent = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : ROOT;
    const resolved = firstExisting(path.resolve(parent, specifier));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
