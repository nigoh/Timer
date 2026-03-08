export const AGENDA_MINUTES_MOBILE_QUERY = "(max-width: 767px)";

export const AGENDA_MINUTES_QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "code-block",
  "image",
  "link",
];

// 空の箇条書き行で Enter を押したときにリスト書式を解除してノーマル段落に戻るバインディング
const listExitKeyboardBindings = {
  listExit: {
    key: "Enter",
    collapsed: true,
    format: ["list"],
    empty: true,
    handler(this: { quill: { format: (name: string, value: boolean, source: string) => void } }) {
      this.quill.format("list", false, "user");
    },
  },
};

export const getAgendaMinutesQuillModules = (isMobile: boolean) => ({
  toolbar: isMobile
    ? [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        ["image", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ]
    : [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        ["image", "code-block"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote"],
        ["link"],
        ["clean"],
      ],
  keyboard: {
    bindings: listExitKeyboardBindings,
  },
});
