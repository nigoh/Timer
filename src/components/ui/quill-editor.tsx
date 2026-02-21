/**
 * React 18 compatible Quill editor wrapper.
 *
 * react-quill v2 calls ReactDOM.findDOMNode() internally, which is deprecated
 * in React 18 and logs console errors in StrictMode. This component uses Quill
 * directly to avoid that call entirely.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import DOMPurify from "dompurify";
import Quill from "quill";
import type { QuillOptions } from "quill";
import "quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

/**
 * Quill の HTML 出力を DOMPurify でサニタイズする。
 * Quill が生成するタグ（p / strong / em / ul / li / a 等）は許可し、
 * script / onerror などの危険な属性を除去する。
 */
const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "blockquote",
      "ol",
      "ul",
      "li",
      "pre",
      "code",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"],
    ALLOW_DATA_ATTR: false,
  });

export interface QuillEditorHandle {
  /** Returns the underlying Quill instance (compatible with react-quill's getEditor()). */
  getEditor(): Quill;
}

interface QuillEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  modules?: QuillOptions["modules"];
  formats?: string[] | null;
  theme?: string;
  className?: string;
  readOnly?: boolean;
}

const QuillEditor = forwardRef<QuillEditorHandle, QuillEditorProps>(
  (
    {
      value,
      onChange,
      modules,
      formats,
      theme = "snow",
      className,
      readOnly = false,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    // Stable ref for onChange so the text-change handler never becomes stale
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    });

    useImperativeHandle(ref, () => ({
      getEditor(): Quill {
        if (!quillRef.current) {
          throw new Error("Quill editor is not initialized");
        }
        return quillRef.current;
      },
    }));

    // Initialize Quill once per mount. The `key` prop on the parent element
    // should be used to force re-initialization when the editor identity changes.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Create a fresh inner div each time so that the toolbar Quill inserts as
      // a sibling (before the target element) lives inside `container`.
      // This ensures container.innerHTML = "" on cleanup removes the toolbar too,
      // preventing duplicate toolbars in React 18 StrictMode double-invocation.
      const editorDiv = document.createElement("div");
      container.appendChild(editorDiv);

      const quill = new Quill(editorDiv, {
        theme,
        modules,
        formats,
        readOnly,
      });
      quillRef.current = quill;

      // Set initial content without triggering onChange
      if (value) {
        const delta = quill.clipboard.convert({ html: value });
        quill.setContents(delta, "silent");
      }

      quill.on("text-change", (_delta, _oldDelta, source) => {
        if (source === "user") {
          onChangeRef.current?.(sanitizeHtml(quill.root.innerHTML));
        }
      });

      return () => {
        quill.off("text-change");
        quillRef.current = null;
        // Clear Quill's DOM (no destroy() in Quill 2.x)
        container.innerHTML = "";
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty – key prop handles re-mount

    // Sync externally-driven value changes into the editor
    useEffect(() => {
      const quill = quillRef.current;
      if (!quill) return;

      const incoming = value ?? "";
      if (incoming !== quill.root.innerHTML) {
        const delta = quill.clipboard.convert({ html: incoming });
        quill.setContents(delta, "silent");
      }
    }, [value]);

    return (
      <div ref={containerRef} className={cn("flex flex-col", className)} />
    );
  },
);

QuillEditor.displayName = "QuillEditor";
export default QuillEditor;
