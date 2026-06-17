import { defineShortcutsSetup } from "@slidev/types";
import type { NavOperations, ShortcutOptions } from "@slidev/types";

export default defineShortcutsSetup(
  (_nav: NavOperations, base: ShortcutOptions[]) => {
    const masked = new Set(["next_right", "prev_left"]);
    return base.filter(({ name }) => !masked.has(name!));
  },
);
