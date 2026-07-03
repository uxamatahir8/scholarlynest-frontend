'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image as ImageExtension } from '@tiptap/extension-image';
import { TextStyle, Color, FontFamily, FontSize as TiptapFontSize } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { TextAlign } from '@tiptap/extension-text-align';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Image, Loader2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link as LinkIcon, Link2Off, Code, Code2,
  Subscript as SubIcon, Superscript as SupIcon,
  Table as TableIcon, Undo2, Redo2, Eraser, Minus,
  Maximize2, Minimize2, Search, ChevronDown, Palette,
  Highlighter, Type, RotateCcw, Check, X, Plus,
  ChevronRight, Columns
} from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';


// 30 Font families
const FONT_FAMILIES = [
  { label: 'Default', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Palatino', value: '"Palatino Linotype", Palatino, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Bookman', value: '"Bookman Old Style", Bookman, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Monaco', value: 'Monaco, "Lucida Console", monospace' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Impact', value: 'Impact, Charcoal, sans-serif' },
  { label: 'Lucida Sans', value: '"Lucida Sans Unicode", "Lucida Grande", sans-serif' },
  { label: 'Century Gothic', value: '"Century Gothic", sans-serif' },
  { label: 'Candara', value: 'Candara, sans-serif' },
  { label: 'Franklin Gothic', value: '"Franklin Gothic Medium", sans-serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", sans-serif' },
  { label: 'Optima', value: 'Optima, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, sans-serif' },
  { label: 'Futura', value: 'Futura, "Century Gothic", sans-serif' },
  { label: 'Didot', value: 'Didot, "Didot LT STD", Georgia, serif' },
  { label: 'Baskerville', value: 'Baskerville, "Baskerville Old Face", serif' },
  { label: 'Bodoni', value: '"Bodoni MT", "Bodoni 72", serif' },
  { label: 'Rockwell', value: 'Rockwell, "Courier Bold", serif' },
  { label: 'Consolas', value: 'Consolas, "Courier New", monospace' },
  { label: 'Calibri', value: 'Calibri, Candara, sans-serif' },
];

const FONT_SIZES = ['10px','11px','12px','13px','14px','16px','18px','20px','22px','24px','28px','32px','36px','42px','48px','56px','64px','72px'];

const TEXT_COLORS = [
  '#000000','#1a1a1a','#374151','#6b7280','#9ca3af','#d1d5db','#ffffff',
  '#dc2626','#ea580c','#d97706','#65a30d','#16a34a','#0891b2','#2563eb',
  '#7c3aed','#9333ea','#db2777','#e11d48','#0369a1','#047857',
  '#fca5a5','#fbbf24','#86efac','#93c5fd','#c4b5fd','#f9a8d4',
];

const HIGHLIGHT_COLORS = [
  '#fef08a','#bbf7d0','#bfdbfe','#e9d5ff','#fecaca','#fed7aa',
  '#ffffff','#f1f5f9','#f0fdf4','#eff6ff','#fdf4ff','#fff1f2',
];

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6];

// Generic dropdown component
function Dropdown({ trigger, children, width = 'w-48' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`absolute top-full left-0 mt-1 ${width} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden`}>
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ onClick, active, title, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-150 text-xs ${active
        ? 'bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/30'
        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-0.5 shrink-0" />;
}

export default function RichEditor({ value, onChange, placeholder = 'Start writing...', minHeight = '320px', className = '' }) {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Lock body scroll when fullscreen is active
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: HEADING_LEVELS } }),
      ImageExtension.configure({ allowBase64: true }),
      TextStyle,
      TiptapFontSize,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'rich-link' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none p-5',
        style: `min-height: ${minHeight};`,
      }
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

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
        const res = await api.post('/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (editor) editor.chain().focus().setImage({ src: res.data.url, alt: file.name }).run();
      } catch {
        toast('Image upload failed. Max 10MB.', 'error');
      }
    };
  }, [editor]);

  const insertLink = () => {
    if (!linkUrl) return;
    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
    }
    setLinkUrl(''); setLinkText(''); setShowLinkModal(false);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableModal(false);
  };

  const doFind = () => {
    if (!findText) return;
    const html = editor.getHTML();
    const found = html.toLowerCase().includes(findText.toLowerCase());
    if (!found) toast(`"${findText}" not found.`, 'error');
    else toast(`Found "${findText}" in content.`, 'success');
  };

  const doReplace = () => {
    if (!findText) return;
    const html = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = html.replace(regex, replaceText);
    editor.commands.setContent(newHtml);
    onChange(newHtml);
    toast(`Replaced all occurrences of "${findText}".`, 'success');
  };

  const wordCount = editor ? editor.storage.characterCount?.words() ?? 0 : 0;
  const charCount = editor ? editor.storage.characterCount?.characters() ?? 0 : 0;

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        <span className="ml-3 text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Initializing Editor...</span>
      </div>
    );
  }

  const activeFont = FONT_FAMILIES.find(f => f.value && editor.isActive('textStyle', { fontFamily: f.value }));

  return (
    <div className={`rich-editor-root border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-[#181817] shadow-sm flex flex-col ${className} ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none m-0' : ''}`}>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-zinc-50 dark:bg-[#111110] border-b border-zinc-200 dark:border-zinc-700 select-none">

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)"><Redo2 className="w-3.5 h-3.5" /></ToolBtn>
        <Divider />

        {/* Font Family */}
        <Dropdown
          width="w-56"
          trigger={
            <button type="button" className="flex items-center space-x-1 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors min-w-[90px] max-w-[120px]">
              <Type className="w-3 h-3 shrink-0" />
              <span className="truncate">{activeFont?.label || 'Font'}</span>
              <ChevronDown className="w-3 h-3 shrink-0" />
            </button>
          }
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {FONT_FAMILIES.map(f => (
              <button
                key={f.label}
                type="button"
                onClick={() => f.value ? editor.chain().focus().setFontFamily(f.value).run() : editor.chain().focus().unsetFontFamily().run()}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
                style={{ fontFamily: f.value || 'inherit' }}
              >
                <span>{f.label}</span>
                {((!f.value && !activeFont) || (f.value && editor.isActive('textStyle', { fontFamily: f.value }))) && <Check className="w-3 h-3 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* Font Size */}
        <Dropdown
          width="w-28"
          trigger={
            <button type="button" className="flex items-center space-x-1 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <span>Size</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
        >
          <div className="max-h-56 overflow-y-auto py-1">
            {FONT_SIZES.map(s => (
              <button key={s} type="button" onClick={() => editor.chain().focus().setFontSize(s).run()}
                className="w-full text-left px-3 py-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors" style={{ fontSize: s }}>
                {s}
              </button>
            ))}
          </div>
        </Dropdown>

        <Divider />

        {/* Heading levels */}
        <Dropdown
          width="w-36"
          trigger={
            <button type="button" className="flex items-center space-x-1 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <span>Heading</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
        >
          <div className="py-1">
            <button type="button" onClick={() => editor.chain().focus().setParagraph().run()}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between">
              <span>Paragraph</span>
              {editor.isActive('paragraph') && <Check className="w-3 h-3 text-[var(--accent)]" />}
            </button>
            {HEADING_LEVELS.map(l => (
              <button key={l} type="button" onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
                style={{ fontSize: `${1.6 - l * 0.15}rem`, fontWeight: 700 }}>
                <span>Heading {l}</span>
                {editor.isActive('heading', { level: l }) && <Check className="w-3 h-3 text-[var(--accent)]" />}
              </button>
            ))}
          </div>
        </Dropdown>

        <Divider />

        {/* Bold / Italic / Underline / Strike */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscript">
          <SubIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superscript">
          <SupIcon className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Text Color */}
        <Dropdown
          width="w-52"
          trigger={
            <button type="button" title="Text Color" className="flex items-center space-x-0.5 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex flex-col items-center">
                <Palette className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <div className="h-[3px] w-3.5 rounded-full mt-0.5" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#374151' }} />
              </div>
            </button>
          }
        >
          <div className="p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Text Color</p>
            <div className="grid grid-cols-7 gap-1">
              {TEXT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => editor.chain().focus().setColor(c).run()}
                  className="w-6 h-6 rounded-md border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-2 w-full text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              Reset Color
            </button>
          </div>
        </Dropdown>

        {/* Highlight Color */}
        <Dropdown
          width="w-52"
          trigger={
            <button type="button" title="Highlight Color" className="flex items-center space-x-0.5 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <div className="flex flex-col items-center">
                <Highlighter className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <div className="h-[3px] w-3.5 rounded-full mt-0.5 bg-yellow-300" />
              </div>
            </button>
          }
        >
          <div className="p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Highlight Color</p>
            <div className="grid grid-cols-6 gap-1">
              {HIGHLIGHT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
                  className="w-6 h-6 rounded-md border border-zinc-300 dark:border-zinc-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
            <button type="button" onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="mt-2 w-full text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              Remove Highlight
            </button>
          </div>
        </Dropdown>

        <Divider />

        {/* Text Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="w-3.5 h-3.5" />
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setShowLinkModal(true); }} active={editor.isActive('link')} title="Insert Link">
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        {editor.isActive('link') && (
          <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
            <Link2Off className="w-3.5 h-3.5" />
          </ToolBtn>
        )}

        {/* Image */}
        <ToolBtn onClick={handleImageUpload} title="Upload Image">
          <Image className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Table */}
        <ToolBtn onClick={() => setShowTableModal(true)} active={editor.isActive('table')} title="Insert Table">
          <TableIcon className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Table operations (shown when in table) */}
        {editor.isActive('table') && (
          <Dropdown width="w-52" trigger={
            <button type="button" className="flex items-center space-x-1 px-2 py-1.5 text-[11px] font-semibold text-[var(--accent)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <Columns className="w-3 h-3" />
              <span>Table</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }>
            <div className="py-1 text-xs">
              {[
                ['Add Column Before', () => editor.chain().focus().addColumnBefore().run()],
                ['Add Column After', () => editor.chain().focus().addColumnAfter().run()],
                ['Delete Column', () => editor.chain().focus().deleteColumn().run()],
                ['Add Row Before', () => editor.chain().focus().addRowBefore().run()],
                ['Add Row After', () => editor.chain().focus().addRowAfter().run()],
                ['Delete Row', () => editor.chain().focus().deleteRow().run()],
                ['Delete Table', () => editor.chain().focus().deleteTable().run()],
                ['Merge Cells', () => editor.chain().focus().mergeCells().run()],
                ['Split Cell', () => editor.chain().focus().splitCell().run()],
                ['Toggle Header Row', () => editor.chain().focus().toggleHeaderRow().run()],
                ['Toggle Header Column', () => editor.chain().focus().toggleHeaderColumn().run()],
              ].map(([label, action]) => (
                <button key={label} type="button" onClick={action}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300">
                  {label}
                </button>
              ))}
            </div>
          </Dropdown>
        )}

        <Divider />

        {/* Clear Formatting */}
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
          <Eraser className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Find & Replace */}
        <ToolBtn onClick={() => setShowFind(!showFind)} active={showFind} title="Find & Replace">
          <Search className="w-3.5 h-3.5" />
        </ToolBtn>

        {/* Fullscreen */}
        <ToolBtn onClick={() => setIsFullscreen(!isFullscreen)} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </ToolBtn>

      </div>

      {/* ── FIND & REPLACE BAR ── */}
      {showFind && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40">
          <Search className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <input
            type="text" value={findText} onChange={e => setFindText(e.target.value)}
            placeholder="Find..." onKeyDown={e => e.key === 'Enter' && doFind()}
            className="text-xs px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-zinc-900 focus:outline-none w-36"
          />
          <ChevronRight className="w-3 h-3 text-amber-500 shrink-0" />
          <input
            type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="text-xs px-2 py-1 border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-zinc-900 focus:outline-none w-36"
          />
          <button type="button" onClick={doFind}
            className="px-2 py-1 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors">
            Find
          </button>
          <button type="button" onClick={doReplace}
            className="px-2 py-1 text-[10px] font-bold uppercase bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors">
            Replace All
          </button>
          <button type="button" onClick={() => setShowFind(false)} className="ml-auto text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── LINK MODAL ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6 w-96 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Insert Link</h3>
              <button type="button" onClick={() => setShowLinkModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">URL *</label>
                <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com"
                  className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Display Text (optional)</label>
                <input type="text" value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Link text..."
                  className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button type="button" onClick={() => setShowLinkModal(false)}
                className="flex-1 py-2 text-xs font-bold uppercase border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={insertLink}
                className="flex-1 py-2 text-xs font-bold uppercase bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg transition-colors">
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE MODAL ── */}
      {showTableModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6 w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Insert Table</h3>
              <button type="button" onClick={() => setShowTableModal(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Rows</label>
                <input type="number" min={1} max={20} value={tableRows} onChange={e => setTableRows(+e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Columns</label>
                <input type="number" min={1} max={10} value={tableCols} onChange={e => setTableCols(+e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none bg-white dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div className="flex space-x-2 pt-1">
              <button type="button" onClick={() => setShowTableModal(false)}
                className="flex-1 py-2 text-xs font-bold uppercase border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={insertTable}
                className="flex-1 py-2 text-xs font-bold uppercase bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-lg transition-colors">
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITOR CONTENT ── */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#181817]">
        <EditorContent editor={editor} />
      </div>

      {/* ── STATUS BAR ── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-50 dark:bg-[#111110] border-t border-zinc-200 dark:border-zinc-700 text-[10px] font-mono text-zinc-400 select-none">
        <div className="flex items-center space-x-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center space-x-3">
          {editor.isActive('bold') && <span className="font-bold text-zinc-600 dark:text-zinc-300">B</span>}
          {editor.isActive('italic') && <span className="italic text-zinc-600 dark:text-zinc-300">I</span>}
          {editor.isActive('underline') && <span className="underline text-zinc-600 dark:text-zinc-300">U</span>}
          {editor.isActive('heading') && <span className="text-[var(--accent)]">H{HEADING_LEVELS.find(l => editor.isActive('heading', { level: l }))}</span>}
          {editor.isActive('table') && <span className="text-blue-500">TABLE</span>}
          <span>Ready</span>
        </div>
      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        .rich-editor-root .ProseMirror { outline: none; min-height: 320px; }
        .rich-editor-root .ProseMirror p { margin-bottom: 0.75em; line-height: 1.7; }
        .rich-editor-root .ProseMirror h1 { font-size: 2em; font-weight: 800; margin-bottom: 0.5em; line-height: 1.2; }
        .rich-editor-root .ProseMirror h2 { font-size: 1.6em; font-weight: 700; margin-bottom: 0.5em; line-height: 1.3; }
        .rich-editor-root .ProseMirror h3 { font-size: 1.35em; font-weight: 700; margin-bottom: 0.5em; }
        .rich-editor-root .ProseMirror h4 { font-size: 1.15em; font-weight: 600; margin-bottom: 0.5em; }
        .rich-editor-root .ProseMirror h5 { font-size: 1em; font-weight: 600; margin-bottom: 0.5em; }
        .rich-editor-root .ProseMirror h6 { font-size: 0.9em; font-weight: 600; margin-bottom: 0.5em; color: #6b7280; }
        .rich-editor-root .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75em; }
        .rich-editor-root .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75em; }
        .rich-editor-root .ProseMirror li { margin-bottom: 0.25em; }
        .rich-editor-root .ProseMirror blockquote { border-left: 4px solid var(--accent-gold, #BFA169); padding: 0.5rem 1rem; font-style: italic; margin: 1em 0; background: #fdf8f0; border-radius: 0 8px 8px 0; color: #78716c; }
        .dark .rich-editor-root .ProseMirror blockquote { background: #1c1a16; color: #a8a29e; }
        .rich-editor-root .ProseMirror code { background: #f1f5f9; color: #0f172a; padding: 0.1em 0.4em; border-radius: 4px; font-size: 0.875em; font-family: monospace; }
        .dark .rich-editor-root .ProseMirror code { background: #1e293b; color: #e2e8f0; }
        .rich-editor-root .ProseMirror pre { background: #0f172a; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1em 0; font-size: 0.875em; }
        .rich-editor-root .ProseMirror pre code { background: none; color: inherit; padding: 0; }
        .rich-editor-root .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1rem 0; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .rich-editor-root .ProseMirror hr { border: none; border-top: 2px solid #e4e4e7; margin: 1.5em 0; }
        .rich-editor-root .ProseMirror a.rich-link { color: var(--accent, #1d4ed8); text-decoration: underline; cursor: pointer; }
        .rich-editor-root .ProseMirror mark { border-radius: 3px; padding: 0 2px; }
        .rich-editor-root .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .rich-editor-root .ProseMirror td, .rich-editor-root .ProseMirror th { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; min-width: 60px; }
        .rich-editor-root .ProseMirror th { background: #f9fafb; font-weight: 700; }
        .dark .rich-editor-root .ProseMirror td, .dark .rich-editor-root .ProseMirror th { border-color: #3f3f46; }
        .dark .rich-editor-root .ProseMirror th { background: #27272a; }
        .rich-editor-root .ProseMirror .selectedCell:after { background: rgba(45, 170, 219, 0.3); content: ""; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; }
        .rich-editor-root .ProseMirror .column-resize-handle { background-color: #6366f1; bottom: -2px; position: absolute; right: -2px; top: 0; width: 4px; pointer-events: none; }
        .rich-editor-root .ProseMirror p.is-editor-empty:first-child::before { color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none; }
      `}</style>
    </div>
  );
}
