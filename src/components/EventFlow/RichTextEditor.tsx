"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import { useEffect } from "react"

interface Props {
  value: string
  onChange: (html: string) => void
}

// ── Toolbar button ───────────────────────────────────────────────────────────

function TBtn({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1.5 text-sm font-body rounded-md transition border ${
        active
          ? "bg-charcoal text-bone border-charcoal"
          : "bg-bone text-charcoal border-hairline hover:border-charcoal/40"
      }`}
    >
      {children}
    </button>
  )
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-bone border border-hairline rounded-t-lg px-3 py-2 border-b-0">
      {/* Headings */}
      <select
        value={
          editor.isActive("heading", { level: 1 })
            ? "1"
            : editor.isActive("heading", { level: 2 })
            ? "2"
            : editor.isActive("heading", { level: 3 })
            ? "3"
            : "p"
        }
        onChange={(e) => {
          const v = e.target.value
          if (v === "p") {
            editor.chain().focus().setParagraph().run()
          } else {
            editor
              .chain()
              .focus()
              .toggleHeading({ level: parseInt(v) as 1 | 2 | 3 })
              .run()
          }
        }}
        className="text-sm font-body bg-bone text-charcoal border border-hairline rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-olive/40"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      <div className="w-px h-6 bg-hairline mx-1" />

      {/* Inline formatting */}
      <TBtn
        title="Bold (⌘+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </TBtn>
      <TBtn
        title="Italic (⌘+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </TBtn>
      <TBtn
        title="Underline (⌘+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </TBtn>
      <TBtn
        title="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </TBtn>

      <div className="w-px h-6 bg-hairline mx-1" />

      {/* Lists */}
      <TBtn
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </TBtn>
      <TBtn
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </TBtn>
      <TBtn
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </TBtn>

      <div className="w-px h-6 bg-hairline mx-1" />

      {/* Alignment */}
      <TBtn
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        ⯇
      </TBtn>
      <TBtn
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        ⯍
      </TBtn>
      <TBtn
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        ⯈
      </TBtn>

      <div className="w-px h-6 bg-hairline mx-1" />

      {/* Link */}
      <TBtn
        title="Insert link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined
          const url = window.prompt("URL", previous ?? "https://")
          if (url === null) return // cancelled
          if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run()
          } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
          }
        }}
      >
        🔗
      </TBtn>

      <div className="w-px h-6 bg-hairline mx-1" />

      {/* Undo/Redo */}
      <TBtn title="Undo (⌘+Z)" onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </TBtn>
      <TBtn title="Redo (⌘+⇧+Z)" onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </TBtn>
    </div>
  )
}

// ── Editor ───────────────────────────────────────────────────────────────────

export function RichTextEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3 bg-bone text-charcoal font-body",
      },
    },
  })

  // Sync external value changes (e.g. when "Fill from template" runs)
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="border border-hairline rounded-b-lg overflow-hidden">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
