// node:test 에서 앱의 "@/..." 별칭 import 를 그대로 로드하기 위한 resolve 훅.
// (tsconfig paths 와 동일하게 저장소 루트를 가리킨다. 테스트 전용이며 앱 번들에는 영향 없음)
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
  if (specifier.startsWith("@/")) {
    const resolved = firstExisting(path.join(ROOT, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
