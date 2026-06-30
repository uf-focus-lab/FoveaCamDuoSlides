import { defineShortcutsSetup } from "@slidev/types";
import type { NavOperations, ShortcutOptions } from "@slidev/types";
import { advanceActiveStage, retreatActiveStage } from "stores/stage";

export default defineShortcutsSetup(
  (nav: NavOperations, base: ShortcutOptions[]) => {
    const defaultNextSpace = base.find(({ name }) => name === "next_space");
    const defaultPrevSpace = base.find(({ name }) => name === "prev_space");
    const masked = new Set([
      "next_right",
      "prev_left",
      "next_space",
      "prev_space",
    ]);
    const shortcuts = base.filter(({ name }) => !masked.has(name!));

    if (defaultNextSpace) {
      shortcuts.push({
        ...defaultNextSpace,
        fn: () => {
          if (!advanceActiveStage(() => void nav.next())) void nav.next();
        },
      });
    }

    if (defaultPrevSpace) {
      shortcuts.push({
        ...defaultPrevSpace,
        fn: () => {
          if (!retreatActiveStage(() => void nav.prev())) void nav.prev();
        },
      });
    }

    return shortcuts;
  },
);
