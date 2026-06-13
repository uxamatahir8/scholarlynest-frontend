'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, File, FileSpreadsheet, FileText, Image, Archive, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ArticleAssetBufferedDropzone({ files, onFilesChanged }) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Allowed MIME types and extensions matching backend configuration
  const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'xls', 'csv', 'zip', 'png', 'jpg', 'jpeg', 'txt'];
  const MAX_FILE_SIZE_KB = 25600; // 25MB

  // Helper to format file size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Helper to get file icon based on mime type or filename extension
  const getFileIcon = (mimeType, filename) => {
    const mime = mimeType?.toLowerCase() || '';
    const ext = filename?.split('.').pop()?.toLowerCase() || '';

    if (mime.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || ['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    }
    if (mime.includes('word') || mime.includes('document') || ['docx', 'doc'].includes(ext)) {
      return <File className="w-8 h-8 text-blue-500" />;
    }
    if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-8 h-8 text-indigo-500" />;
    }
    if (mime.includes('zip') || mime.includes('compressed') || ['zip', 'rar', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-8 h-8 text-amber-600" />;
    }
    return <File className="w-8 h-8 text-zinc-500" />;
  };

  // Validate file size and type
  const validateFile = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      toast(`File "${file.name}" has an unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`, 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_KB * 1024) {
      toast(`File "${file.name}" exceeds the 25MB maximum size limit.`, 'error');
      return false;
    }
    // Check duplicate
    if (files.some(f => f.name === file.name && f.size === file.size)) {
      toast(`File "${file.name}" is already selected.`, 'error');
      return false;
    }
    return true;
  };

  // Drag over handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Local selection handlers
  const handleAddFiles = (selectedFiles) => {
    const validFiles = [];
    Array.from(selectedFiles).forEach(file => {
      if (validateFile(file)) {
        validFiles.push(file);
      }
    });

    if (validFiles.length > 0) {
      onFilesChanged([...files, ...validFiles]);
      toast(`${validFiles.length} supplementary asset(s) added to upload queue.`, 'success');
    }
  };

  // Drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // File change handler (from input)
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
    }
  };

  // Delete handler
  const handleDelete = (indexToDelete, filename) => {
    onFilesChanged(files.filter((_, index) => index !== indexToDelete));
    toast(`Asset "${filename}" removed from queue.`, 'success');
  };

  // Click handler to open file picker
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="space-y-4 font-sans text-left">
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-serif">Supplementary Assets</h3>
      
      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`w-full min-h-[160px] border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 relative ${
          dragActive
            ? 'border-amber-500 bg-amber-500/5 dark:border-amber-500/20'
            : 'border-zinc-200 hover:border-amber-500 dark:border-zinc-800 dark:hover:border-amber-500/50 bg-zinc-50/50 dark:bg-zinc-900/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <Upload className={`w-8 h-8 mb-3 transition-colors ${dragActive ? 'text-amber-500' : 'text-zinc-400'}`} />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Drag & drop supplementary files here, or <span className="text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline">browse files</span>
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1.5">
          Supports PDF, Word, Excel, CSV, ZIP, Images (Max 25MB each)
        </p>
      </div>

      {/* Asset list queue */}
      {files && files.length > 0 && (
        <div className="space-y-2 border border-zinc-200 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 p-4 rounded-xl shadow-sm animate-in fade-in duration-300">
          <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-widest block mb-1">
            Supplementary Assets Queue ({files.length} file{files.length > 1 ? 's' : ''} queued)
          </span>
          
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850/50">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-zinc-150/50 dark:bg-zinc-850/50 rounded-lg shrink-0">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-zinc-855 dark:text-zinc-200 truncate">{file.name}</p>
                    <p className="text-[9px] text-zinc-550 font-mono uppercase tracking-widest">
                      Size: {formatBytes(file.size)} • Queued for upload
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index, file.name);
                  }}
                  className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 transition-colors cursor-pointer"
                  title="Remove from queue"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
