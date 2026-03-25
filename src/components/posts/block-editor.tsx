"use client";

import { useEffect } from "react";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  ListOrdered,
  List,
  Quote,
  Code2,
} from "lucide-react";

interface BlockEditorProps {
  value?: JSONContent;
  onChange: (value: JSONContent) => void;
}

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
};

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your post...",
      }),
    ],
    content: value ?? EMPTY_DOC,
    autofocus: "end",
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value) {
      editor.commands.setContent(value, false);
    }
    // we intentionally do not include editor in deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const isActive = editor.isActive.bind(editor);

  return (
    <div className="border rounded-md bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/60 px-2 py-1.5">
        <Button
          type="button"
          size="sm"
          variant={isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled
          aria-label="Underline"
        >
          <Underline className="h-3.5 w-3.5 opacity-40" />
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          variant={isActive("heading", { level: 1 }) ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 className="mr-1 h-3.5 w-3.5" />
          H1
        </Button>
        <Button
          type="button"
          variant={isActive("heading", { level: 2 }) ? "default" : "ghost"}
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 className="mr-1 h-3.5 w-3.5" />
          H2
        </Button>
        <span className="mx-1 h-5 w-px bg-border" />
        <Button
          type="button"
          size="sm"
          variant={isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isActive("orderedList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isActive("blockquote") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isActive("codeBlock") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code block"
        >
          <Code2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="prose prose-sm max-w-none px-3 py-2 dark:prose-invert">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

