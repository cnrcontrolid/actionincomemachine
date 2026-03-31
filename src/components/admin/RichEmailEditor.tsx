"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect, useCallback } from "react";
import { Bold, Italic, Underline as UnderlineIcon, List, Heading2, Link as LinkIcon, Minus } from "lucide-react";

interface RichEmailEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichEmailEditor({ value, onChange }: RichEmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[280px] px-4 py-3 focus:outline-none text-sm text-gray-800",
      },
    },
  });

  // Sync external value changes (e.g. loading a template)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Expose insertToken method via ref-like callback
  const insertToken = useCallback((token: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(token).run();
  }, [editor]);

  // Expose to parent via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      insertToken(customEvent.detail);
    };
    document.addEventListener("insert-email-token", handler);
    return () => document.removeEventListener("insert-email-token", handler);
  }, [insertToken]);

  function setLink() {
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        <ToolbarBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading"
        >
          <Heading2 size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus size={14} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarBtn
          active={editor.isActive("link")}
          onClick={setLink}
          title="Link"
        >
          <LinkIcon size={14} />
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            active={false}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
          >
            <span className="text-xs">Unlink</span>
          </ToolbarBtn>
        )}
      </div>

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#FFAA00] text-white"
          : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
