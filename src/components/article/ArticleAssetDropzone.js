'use client';

import { safeApiMessage } from '../../utils/safeErrors';
import React, { useState, useRef } from 'react';
import { Upload, X, File, FileSpreadsheet, FileText, Image, Loader2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import { logError } from '../../utils/safeLogger';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { pollUploadUntilSettled, uploadDirectToS3 } from '../../lib/mediaUploads/DirectUploadClient';

export default function ArticleAssetDropzone({ articleId, assets, onAssetsChanged }) {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canDeleteRecords = hasRole('super_admin');
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState({}); // tracking upload status of files by name
  const fileInputRef = useRef(null);

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
    return <File className="w-8 h-8 text-zinc-500" />;
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

  // Upload handler
  const uploadFile = async (file) => {
    const tempId = file.name + '-' + Date.now();
    setUploadingFiles(prev => ({
      ...prev,
      [tempId]: { name: file.name, size: file.size, error: null, progress: 0, state: 'Uploading' }
    }));

    try {
      const upload = await uploadDirectToS3({
        file,
        purpose: 'article_supplementary',
        attachableId: articleId,
        onProgress: (progress) => {
          setUploadingFiles(prev => ({
            ...prev,
            [tempId]: { ...prev[tempId], progress, state: 'Uploading' }
          }));
        },
        onState: (state) => {
          const label = state === 'awaiting_scan' ? 'Awaiting security scan' : state === 'initiating' ? 'Preparing upload' : 'Uploading';
          setUploadingFiles(prev => ({
            ...prev,
            [tempId]: { ...prev[tempId], state: label }
          }));
        },
      });

      setUploadingFiles(prev => ({
        ...prev,
        [tempId]: { ...prev[tempId], progress: 100, state: 'Awaiting security scan' }
      }));

      const settled = await pollUploadUntilSettled(upload.id, (latest) => {
        const statusLabel = latest.status === 'scanning' ? 'Scanning' : latest.status === 'uploaded_pending_scan' ? 'Awaiting security scan' : latest.status;
        setUploadingFiles(prev => ({
          ...prev,
          [tempId]: { ...prev[tempId], state: statusLabel }
        }));
      });

      if (settled?.status === 'clean') {
        const assetId = settled.record?.article_asset_id;
        onAssetsChanged([...assets, {
          id: assetId,
          article_id: articleId,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          scan_status: 'clean',
          available: true,
        }]);
        toast(`File "${file.name}" is available after security scan.`, 'success');
      } else if (settled?.status) {
        throw new Error(settled.status === 'rejected' ? 'File rejected during security scan.' : 'File could not be processed.');
      } else {
        toast(`File "${file.name}" is awaiting security scan.`, 'info');
      }

      setUploadingFiles(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
    } catch (err) {
      logError('File upload error:', err);
      const errMsg = err?.message || safeApiMessage(err, `Failed to upload "${file.name}"`);
      toast(errMsg, 'error');
      
      setUploadingFiles(prev => ({
        ...prev,
        [tempId]: { ...prev[tempId], error: errMsg }
      }));
    }
  };

  // Drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        uploadFile(file);
      });
    }
  };

  // File change handler (from input)
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        uploadFile(file);
      });
    }
  };

  // Delete handler
  const handleDelete = async (assetId, filename) => {
    if (!canDeleteRecords) return;
    try {
      await api.delete(`/articles/assets/${assetId}`);
      onAssetsChanged(assets.filter(a => a.id !== assetId));
      toast(`Asset "${filename}" deleted successfully.`, 'success');
    } catch (err) {
      logError('Failed to delete asset:', err);
      toast(safeApiMessage(err, 'Failed to delete supplementary asset.'), 'error');
    }
  };

  // Click handler to open file picker
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearUploadingError = (tempId) => {
    setUploadingFiles(prev => {
      const next = { ...prev };
      delete next[tempId];
      return next;
    });
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
          onChange={handleChange}
          className="hidden"
        />
        <Upload className={`w-8 h-8 mb-3 transition-colors ${dragActive ? 'text-amber-500' : 'text-zinc-400'}`} />
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Drag & drop supplementary files here, or <span className="text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline">browse files</span>
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1.5">
          Supports PDF, Word, Excel, CSV, TXT, and images (Max 25MB each)
        </p>
      </div>

      {/* Asset list queue */}
      {((assets && assets.length > 0) || Object.keys(uploadingFiles).length > 0) && (
        <div className="space-y-2 border border-zinc-200 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 p-4 rounded-xl shadow-sm">
          <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-widest block mb-1">
            Supplementary Assets List
          </span>
          
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850/50">
            {/* Uploading Queue */}
            {Object.entries(uploadingFiles).map(([tempId, info]) => (
              <div key={tempId} className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg shrink-0">
                    {info.error ? <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" /> : <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">{info.name}</p>
                    <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                      {info.error ? <span className="text-red-550 font-bold">Failed to upload</span> : <span>{info.state || 'Uploading'} ({info.progress || 0}%)</span>}
                    </p>
                  </div>
                </div>
                <div>
                  {info.error ? (
                    <button
                      type="button"
                      onClick={() => clearUploadingError(tempId)}
                      className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                      title="Clear error"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="w-4 h-4 mr-2" />
                  )}
                </div>
              </div>
            ))}

            {/* Completed Assets */}
            {assets && assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-zinc-150/50 dark:bg-zinc-850/50 rounded-lg shrink-0">
                    {getFileIcon(asset.mime_type, asset.original_filename)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 truncate">{asset.original_filename}</p>
                    <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                      Size: {formatBytes(asset.file_size)} • {asset.scan_status && asset.scan_status !== 'clean' ? 'Awaiting security scan' : (asset.mime_type || 'Unknown Type')}
                    </p>
                  </div>
                </div>
                {canDeleteRecords && (
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id, asset.original_filename)}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-650 transition-colors cursor-pointer"
                    title="Remove supplementary asset"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
