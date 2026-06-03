'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Download, Share2, Clipboard, 
  Loader2, AlertCircle, Calendar, User, Award, CheckCircle2, Info, X, Code 
} from 'lucide-react';
import api from '../../../../../utils/api';
import { useToast } from '../../../../../context/ToastContext';

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params ? params.slug : null;
  const articleSlug = params ? params.articleSlug : null;
  
  const { toast } = useToast();

  const [article, setArticle] = useState(null);
  const [authorMetrics, setAuthorMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('abstract');
  const [downloading, setDownloading] = useState(false);

  // Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [embedCodeCopied, setEmbedCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast('Link copied to clipboard!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);

    if (article) {
      api.post(`/articles/${article.id}/share-click`, { platform: 'copy_link' }).catch((err) => {
        console.error('Failed to log share click:', err);
      });
    }
  };

  const getEmbedCode = () => {
    if (!article || typeof window === 'undefined') return '';
    return `<iframe src="${window.location.origin}/magazines/${slug}/articles/${articleSlug}" width="100%" height="500" style="border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" title="${article.title}"></iframe>`;
  };

  const handleCopyEmbed = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(getEmbedCode());
    setEmbedCodeCopied(true);
    toast('Embed code copied to clipboard!', 'success');
    setTimeout(() => setEmbedCodeCopied(false), 2000);

    if (article) {
      api.post(`/articles/${article.id}/share-click`, { platform: 'copy_embed' }).catch((err) => {
        console.error('Failed to log share click:', err);
      });
    }
  };

  const sharePlatforms = [
    { id: 'linkedin', name: 'LinkedIn', color: 'hover:bg-[#0077b5]/10 hover:text-[#0077b5] dark:hover:bg-[#0077b5]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> },
    { id: 'twitter', name: 'Twitter/X', color: 'hover:bg-black/10 hover:text-black dark:hover:bg-white/10 dark:hover:text-white', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'facebook', name: 'Facebook', color: 'hover:bg-[#1877f2]/10 hover:text-[#1877f2] dark:hover:bg-[#1877f2]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg> },
    { id: 'whatsapp', name: 'WhatsApp', color: 'hover:bg-[#25d366]/10 hover:text-[#25d366] dark:hover:bg-[#25d366]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { id: 'reddit', name: 'Reddit', color: 'hover:bg-[#ff4500]/10 hover:text-[#ff4500] dark:hover:bg-[#ff4500]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.24-1.72l1.37-4.31 3.9 1c.2 1.28 1.12 2.28 2.21 2.28 1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5c-1.09 0-2 .78-2.21 1.78l-4.21-1.1c-.26-.06-.54.1-.63.36l-1.63 5.13c-2.45.04-4.71.68-6.38 1.7-.56-.73-1.44-1.19-2.43-1.19-1.65 0-3 1.35-3 3 0 1.1.61 2.08 1.52 2.61-.06.28-.09.58-.09.89 0 3.73 4.29 6.75 9.5 6.75s9.5-3.02 9.5-6.75c0-.31-.03-.61-.09-.89.92-.52 1.54-1.5 1.54-2.61zm-17.5 1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm9 3.5c-.88.88-2.52.88-3.4 0-.15-.15-.15-.39 0-.54.15-.15.39-.15.54 0 .58.58 1.74.58 2.32 0 .15-.15.39-.15.54 0 .15.15.15.39 0 .54zm-.5-2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/></svg> },
    { id: 'telegram', name: 'Telegram', color: 'hover:bg-[#0088cc]/10 hover:text-[#0088cc] dark:hover:bg-[#0088cc]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.1-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.25z"/></svg> },
    { id: 'pinterest', name: 'Pinterest', color: 'hover:bg-[#bd081c]/10 hover:text-[#bd081c] dark:hover:bg-[#bd081c]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.41 7.61 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.907 2.17-2.907 1.02 0 1.513.769 1.513 1.686 0 1.026-.652 2.561-.99 3.981-.283 1.192.597 2.164 1.774 2.164 2.128 0 3.766-2.245 3.766-5.486 0-2.868-2.061-4.87-5.003-4.87-3.41 0-5.41 2.561-5.41 5.202 0 1.03.397 2.133.892 2.733.098.12.112.223.083.345l-.348 1.423c-.056.23-.186.277-.429.166-1.6-1.33-2.6-3.137-2.6-5.474 0-4.464 3.242-8.564 9.356-8.564 4.914 0 8.73 3.502 8.73 8.18 0 4.881-3.078 8.81-7.365 8.81-1.438 0-2.79-.747-3.251-1.631 0 0-.712 2.714-.887 3.393-.32 1.232-1.187 2.776-1.766 3.708 1.127.348 2.32.535 3.56.535 6.616 0 11.983-5.365 11.983-11.985C23.996 5.367 18.63 0 12.017 0z"/></svg> },
    { id: 'pocket', name: 'Pocket', color: 'hover:bg-[#ee4056]/10 hover:text-[#ee4056] dark:hover:bg-[#ee4056]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c6.627 0 12 5.373 12 12v3.5c0 3.59-2.91 6.5-6.5 6.5H6.5C2.91 24 0 21.09 0 17.5V14c0-6.627 5.373-12 12-12zm4.621 10.379L12 17l-4.621-4.621-1.414 1.414L12 19.828l6.035-6.035-1.414-1.414z"/></svg> },
    { id: 'hackernews', name: 'Hacker News', color: 'hover:bg-[#ff6600]/10 hover:text-[#ff6600] dark:hover:bg-[#ff6600]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="#ff6600"/><path d="M4.976 4h2.476l3.528 6.556L14.492 4h2.476L12.5 11.832v6.668H9.5v-6.668L4.976 4z" fill="#fff"/></svg> },
    { id: 'tumblr', name: 'Tumblr', color: 'hover:bg-[#35465c]/10 hover:text-[#35465c] dark:hover:bg-[#35465c]/20', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V10.42H5.163V7.697c2.424-.764 3.905-2.88 4.227-4.996h2.894v4.996h3.818v2.723h-3.818v6.837c0 1.404.623 2.164 2.052 2.164.675 0 1.25-.133 1.758-.33l.977 2.651A8.258 8.258 0 0 1 14.563 24z"/></svg> },
    { id: 'buffer', name: 'Buffer', color: 'hover:bg-[#111111]/10 hover:text-[#111111] dark:hover:bg-white/10 dark:hover:text-white', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 6L12 1.5 2 6l10 4.5L22 6zm-10 6.5L3.5 9 2 9.68v2l10 4.5 10-4.5v-2l-1.5-.68-8.5 3.5zm0 4.5l-8.5-3.5-1.5.68v2l10 4.5 10-4.5v-2l-1.5-.68-8.5 3.5z"/></svg> },
    { id: 'email', name: 'Email', color: 'hover:bg-zinc-500/10 hover:text-zinc-650 dark:hover:bg-zinc-500/20 dark:hover:text-zinc-300', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> }
  ];

  useEffect(() => {
    if (!articleSlug) return;

    const fetchArticleData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/articles/${articleSlug}`);
        setArticle(response.data.article);
        setAuthorMetrics(response.data.author_metrics);
      } catch (err) {
        console.error('Failed to load article details', err);
        setError('The specified research manuscript could not be found or loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [articleSlug]);

  // Handle PDF Download Trigger
  const handlePdfDownload = async () => {
    if (!article?.pdf_path) {
      toast('No pre-compiled PDF available for this manuscript.', 'info');
      return;
    }

    try {
      setDownloading(true);
      // Construct public streaming endpoint path
      const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const fileUrl = `${baseApiUrl}/articles/${article.id}/download-pdf`;
      
      // Trigger browser download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = `scholarlynest_${article.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast('PDF file downloaded successfully.', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to initialize PDF resource download.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  // Copy citation details to clipboard
  const handleCopyCitation = () => {
    if (!article) return;

    const citationText = `"${article.title}" by ${article.user?.name}. Published on ScholarlyNest, ${new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}. URI: ${window.location.href}`;
    
    navigator.clipboard.writeText(citationText);
    toast('Citation copied to clipboard!', 'success');

    api.post(`/articles/${article.id}/share-click`, { platform: 'copy_citation' }).catch((err) => {
      console.error('Failed to log share click:', err);
    });
  };

  // Social Share engine
  const handleSocialShare = (platform) => {
    if (!article) return;
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this research paper: "${article.title}" on ScholarlyNest`);
    
    let shareUrl = '';
    let platformName = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${text}`;
        platformName = 'Twitter/X';
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
        platformName = 'LinkedIn';
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
        platformName = 'Facebook';
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${text}%20${pageUrl}`;
        platformName = 'WhatsApp';
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${pageUrl}&title=${text}`;
        platformName = 'Reddit';
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${pageUrl}&text=${text}`;
        platformName = 'Telegram';
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${pageUrl}&description=${text}`;
        platformName = 'Pinterest';
        break;
      case 'pocket':
        shareUrl = `https://getpocket.com/save?url=${pageUrl}&title=${text}`;
        platformName = 'Pocket';
        break;
      case 'hackernews':
        shareUrl = `https://news.ycombinator.com/submitlink?u=${pageUrl}&t=${text}`;
        platformName = 'Hacker News';
        break;
      case 'tumblr':
        shareUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${pageUrl}&title=${text}`;
        platformName = 'Tumblr';
        break;
      case 'buffer':
        shareUrl = `https://buffer.com/add?url=${pageUrl}&text=${text}`;
        platformName = 'Buffer';
        break;
      case 'email':
        shareUrl = `mailto:?subject=${text}&body=${pageUrl}`;
        platformName = 'Email';
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=450');
      toast(`Redirecting to share on ${platformName}.`, 'success');

      api.post(`/articles/${article.id}/share-click`, { platform }).catch((err) => {
        console.error('Failed to log share click:', err);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-[var(--background)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent)]" />
        <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-widest font-mono">
          Acquiring Research Metadata...
        </span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background)]">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Manuscript Error</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error || 'Article details could not be parsed.'}</p>
          <Link href={`/magazines/${slug}`} className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Magazine</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pb-24 font-sans px-4 sm:px-6 lg:px-8">
      <title>{`${article.title}  - ScholarlyNest`}</title>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation back-link */}
        <Link 
          href={`/magazines/${slug}`}
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {article.magazine?.title} Shell</span>
        </Link>

        {/* METADATA HEADER BLOCK */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 backdrop-blur shadow-sm space-y-6">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--accent-gold)] px-2.5 py-1 rounded bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/10 inline-block">
              Published Article
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white leading-tight">
              {article.title}
            </h1>
          </div>

          <div className="h-px bg-zinc-250/20 dark:bg-zinc-800" />

          {/* Author information & metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-full bg-[var(--accent)]/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 text-[var(--accent)] dark:text-white">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-none">
                  {article.user?.name}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {article.user?.email}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-mono font-bold uppercase tracking-wider text-[var(--muted)] border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-450 block font-sans">Author Index</span>
                <span className="text-zinc-800 dark:text-zinc-200 flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-[var(--accent-gold)]" />
                  {authorMetrics?.total_papers_approved} approved papers
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-450 block font-sans">Date Published</span>
                <span className="text-zinc-800 dark:text-zinc-200 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DUAL-STATE COMPONENT SWITCHER (SEGMENTED TABS) */}
        <div className="space-y-6">
          <div className="flex rounded-xl p-1 bg-zinc-150 dark:bg-zinc-800 border border-zinc-250/20 max-w-sm">
            <button
              onClick={() => setActiveTab('abstract')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'abstract'
                  ? 'bg-white dark:bg-zinc-900 text-[var(--accent)] dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Abstract</span>
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'fulltext'
                  ? 'bg-white dark:bg-zinc-900 text-[var(--accent)] dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-350'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Text</span>
            </button>
          </div>

          {/* Render Panel */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/30 backdrop-blur shadow-sm min-h-[300px]">
            {activeTab === 'abstract' ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-white">Abstract Synopsis</h3>
                <div 
                  className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed prose dark:prose-invert max-w-none font-medium italic"
                  dangerouslySetInnerHTML={{ __html: article.abstract }}
                />
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h3 className="font-serif text-xl font-bold text-zinc-900 dark:text-white">Full Manuscript Text</h3>
                <div 
                  className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed prose dark:prose-invert max-w-none font-medium"
                  dangerouslySetInnerHTML={{ __html: article.full_text }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ACTION DASHBOARD (Social Share & Download Engine) */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/50 backdrop-blur shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Download PDF button */}
          <button
            onClick={handlePdfDownload}
            disabled={downloading || !article.pdf_path}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[var(--accent)] hover:bg-[var(--accent)]/95 shadow-[0_0_15px_rgba(44,67,102,0.3)] transition-premium cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download Official PDF</span>
          </button>

          {/* Single Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700/60"
            title="Open Share Options"
          >
            <Share2 className="w-4 h-4 text-[var(--accent)]" />
            <span>Share Paper</span>
          </button>

        </div>

      </div>

      {/* SHARE MODAL OVERLAY */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Disseminate Research</h3>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-bold leading-none">Share & Embed scientific paper</p>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)} 
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              
              {/* 1. 10-12 Grid share buttons */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Select Social Network
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {sharePlatforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => handleSocialShare(platform.id)}
                      className={`flex items-center space-x-2.5 p-3 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-700 dark:text-zinc-300 font-semibold text-xs tracking-wide transition-all cursor-pointer ${platform.color}`}
                    >
                      <span className="shrink-0">{platform.icon}</span>
                      <span className="truncate">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Direct Link Citation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                    Direct Page Link
                  </span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      className="flex-grow text-xs font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-950 dark:hover:bg-zinc-650 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {linkCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                    Cite / Metadata
                  </span>
                  <button
                    onClick={handleCopyCitation}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-250 dark:border-zinc-700/60 rounded-lg transition-colors cursor-pointer h-[38px]"
                  >
                    <Clipboard className="w-4 h-4 text-[var(--accent-gold)]" />
                    <span>Copy Harvard Citation</span>
                  </button>
                </div>
              </div>

              {/* 3. Embed Article Code */}
              <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center">
                    <Code className="w-3.5 h-3.5 mr-1 text-[var(--accent)]" />
                    Iframe Embed HTML Code
                  </span>
                  <button
                    onClick={handleCopyEmbed}
                    className="text-[10px] font-bold uppercase text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    {embedCodeCopied ? 'Embed Copied!' : 'Copy Code'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={getEmbedCode()}
                  rows={3}
                  className="w-full font-mono text-[10px] p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
