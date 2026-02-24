import { Node, mergeAttributes } from "@tiptap/core";

export const Column = Node.create({
  name: "column",
  group: "block",
  content: "block+",
  isolating: false,

  addAttributes() {
    return {};
  },

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "column" }),
      0,
    ];
  },
});
