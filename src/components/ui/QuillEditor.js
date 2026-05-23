'use client';

import React, { useEffect, useRef } from 'react';
import 'quill/dist/quill.snow.css';

export default function QuillEditor({ value, onChange, placeholder = 'Start writing details...' }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    // Require quill dynamically to avoid SSR document/window undefined issues
    const Quill = require('quill');
    const QuillConstructor = Quill.default || Quill;

    const quill = new QuillConstructor(containerRef.current, {
      theme: 'snow',
      placeholder: placeholder,
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'clean']
        ]
      }
    });

    quillRef.current = quill;

    if (value) {
      quill.root.innerHTML = value;
    }

    quill.on('text-change', () => {
      if (isUpdatingRef.current) return;
      const html = quill.root.innerHTML;
      onChange(html === '<p><br></p>' ? '' : html);
    });
  }, []);

  // Sync value from external state change
  useEffect(() => {
    if (quillRef.current && value !== undefined && value !== quillRef.current.root.innerHTML) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value]);

  return <div ref={containerRef} />;
}
