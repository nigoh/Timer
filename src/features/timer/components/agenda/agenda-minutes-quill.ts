export const AGENDA_MINUTES_MOBILE_QUERY = "(max-width: 767px)";

export const AGENDA_MINUTES_QUILL_FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
];

export const getAgendaMinutesQuillModules = (isMobile: boolean) => ({
  toolbar: isMobile
    ? [
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "clean"],
      ]
    : [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
});
