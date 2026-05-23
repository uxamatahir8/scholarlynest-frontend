'use client';

import React, { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Image, Loader2 
} from 'lucide-react';
import api from '../../utils/api';

export default function RichEditor({ value, onChange, placeholder = 'Start writing...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      ImageExtension
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none min-h-[300px] p-4'
      }
    }
  });

  // Keep content in sync with external model state
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Handle image upload and insert
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post('/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const url = res.data.url;
        if (editor) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (err) {
        console.error('Image upload failed', err);
        alert('Image upload failed. Please ensure it is under 10MB.');
      }
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Initializing ProseMirror...</span>
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-[#181817] shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-[#121211] border-b border-zinc-200 dark:border-zinc-800">
        
        {/* Bold Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('bold') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('italic') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Strikethrough Button */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('strike') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Heading 1 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg hover:bg-zinc-250 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('bulletList') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-lg hover:bg-zinc-250 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('orderedList') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded-lg hover:bg-zinc-250 dark:hover:bg-zinc-800 transition-colors ${
            editor.isActive('blockquote') ? 'bg-zinc-200 text-zinc-950 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
          }`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* Image Attachment */}
        <button
          type="button"
          onClick={handleImageUpload}
          className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
          title="Upload Image"
        >
          <Image className="w-4 h-4" />
        </button>

      </div>

      {/* Editor Content Area */}
      <div className="bg-white dark:bg-[#181817] min-h-[300px]">
        <EditorContent editor={editor} />
      </div>
      
      {/* Self-contained styling overrides for ProseMirror content inside Tailwind */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
          outline: none;
        }
        .ProseMirror p {
          margin-bottom: 0.8em;
          line-height: 1.6;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.8em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.8em;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--accent-gold, #BFA169);
          padding-left: 1rem;
          font-style: italic;
          margin-bottom: 0.8em;
          color: #71717a;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      `}</style>
    </div>
  );
}
