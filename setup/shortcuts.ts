import { defineShortcutsSetup } from "@slidev/types";
import type { NavOperations, ShortcutOptions } from "@slidev/types";
import { advanceActiveStage } from "stores/stage";

export default defineShortcutsSetup(
  (nav: NavOperations, base: ShortcutOptions[]) => {
    const masked = new Set(["next_right", "prev_left"]);
    return base
      .filter(({ name }) => !masked.has(name!))
      .map((shortcut) =>
        shortcut.name === "next_space"
          ? {
              ...shortcut,
              fn: () => {
                if (!advanceActiveStage()) void nav.next();
              },
            }
          : shortcut,
      );
  },
);
