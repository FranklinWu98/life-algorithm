import { Extension } from "@tiptap/core";

/**
 * When the cursor is inside a text block, Ctrl+A (Cmd+A) selects all text
 * within that block. If the selection already spans the entire block,
 * the default behaviour (select all) is allowed.
 */
export const SelectBlockText = Extension.create({
  name: "selectBlockText",

  addKeyboardShortcuts() {
    return {
      "Mod-a": () => {
        const { state } = this.editor;
        const { $from, $to } = state.selection;

        // Only intercept inside text blocks (paragraph, heading, etc.)
        if (!$from.parent.isTextblock) {
          return false;
        }

        const blockStart = $from.start($from.depth);
        const blockEnd = $from.end($from.depth);

        // If the selection already covers the whole block, fall through to
        // the default select-all so the user can press Ctrl+A again to select
        // the entire document.
        if ($from.pos === blockStart && $to.pos === blockEnd) {
          return false;
        }

        return this.editor.commands.setTextSelection({
          from: blockStart,
          to: blockEnd,
        });
      },
    };
  },
});
