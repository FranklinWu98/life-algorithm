import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (count?: number) => ReturnType;
    };
  }
}

export const Columns = Node.create({
  name: "columns",
  group: "block",
  content: "column{2,4}",
  defining: true,
  isolating: false,

  parseHTML() {
    return [{ tag: 'div[data-type="columns"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "columns" }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumns:
        (count = 2) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: Array.from({ length: count }, () => ({
                type: "column",
                content: [{ type: "paragraph" }],
              })),
            })
            .run();
        },
    };
  },
});
