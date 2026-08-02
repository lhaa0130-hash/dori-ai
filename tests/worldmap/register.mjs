// node --import ./tests/worldmap/register.mjs 로 resolve 훅을 등록한다.
import { register } from "node:module";
register("./resolve-hooks.mjs", import.meta.url);
