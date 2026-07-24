// node --import ./tests/emulator/register-alias.mjs 로 alias 훅을 등록한다.
import { register } from "node:module";
register("./alias-hooks.mjs", import.meta.url);
