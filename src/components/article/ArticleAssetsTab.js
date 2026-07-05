'use client';

import React from 'react';
import { Download, File, FileSpreadsheet, FileText, Image, Archive, FileQuestion, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';

export default function ArticleAssetsTab({ assets }) {
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
      return <FileText className="w-6 h-6 text-red-500" />;
    }
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || ['xlsx', 'xls', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    }
    if (mime.includes('word') || mime.includes('document') || ['docx', 'doc'].includes(ext)) {
      return <File className="w-6 h-6 text-blue-500" />;
    }
    if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image className="w-6 h-6 text-indigo-500" />;
    }
    if (mime.includes('zip') || mime.includes('compressed') || ['zip', 'rar', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-6 h-6 text-amber-600" />;
    }
    return <FileQuestion className="w-6 h-6 text-zinc-500" />;
  };

  if (!assets || assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-200">
        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
        <p className="text-sm font-semibold text-zinc-550 dark:text-zinc-450">
          No supplementary assets have been uploaded for this manuscript.
        </p>
      </div>
    );
  }

  // Get the base API URL to route the download request
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const handleDownload = async (event, downloadUrl) => {
    event.preventDefault();
    const response = await api.get(downloadUrl.replace(apiBase, ''));
    if (response.data?.url) {
      window.location.assign(response.data.url);
      return;
    }
    window.location.assign(downloadUrl);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 text-left">
      <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
        <h3 className="font-serif text-lg font-bold text-zinc-900 dark:text-white">Supplementary Materials & Datasets</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Download support files, worksheets, reference visuals, and auxiliary resources provided by the authors.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset) => {
          const downloadUrl = `${apiBase}/articles/assets/${asset.id}/download`;
          const available = asset.available !== false && (!asset.scan_status || asset.scan_status === 'clean');
          
          return available ? (
            <a
              key={asset.id}
              href={downloadUrl}
              onClick={(event) => handleDownload(event, downloadUrl)}
              download
              className="bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl transition-all flex items-center justify-between group cursor-pointer hover:scale-[1.01] hover:shadow-sm"
              title={`Download ${asset.original_filename}`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                  {getFileIcon(asset.mime_type, asset.original_filename)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate group-hover:text-[var(--accent)] dark:group-hover:text-blue-400 transition-colors">
                    {asset.original_filename}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                    Size: {formatBytes(asset.file_size)}
                  </p>
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-500 group-hover:text-[var(--accent)] dark:group-hover:text-blue-400 transition-all shadow-sm shrink-0">
                <Download className="w-4 h-4" />
              </div>
            </a>
          ) : (
            <div
              key={asset.id}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between opacity-80"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate">
                    {asset.original_filename}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">
                    Awaiting security scan
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
