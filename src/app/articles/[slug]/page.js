'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, Download, Share2, Clipboard, 
  Loader2, AlertCircle, Calendar, CheckCircle2, Info, X, Code,
  ChevronRight, FileSpreadsheet, File, Image, FileQuestion, Mail
} from 'lucide-react';
import api from '../../../utils/api';
import { logError } from '../../../utils/safeLogger';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import ArticlePagination from '../../../components/article/ArticlePagination';
import ImageLightboxGallery from '../../../components/ui/ImageLightboxGallery';
import SeoHead from '../../../components/SeoHead';
import AuthorHeaderBlock from '../../../components/article/AuthorHeaderBlock';
import { isArticleEditableStatus } from '../../../utils/status';
import { publicArticlePath } from '../../../utils/articleLinks';
import AdvertisementSlot from '../../../components/advertising/AdvertisementSlot';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? path : '/' + path;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const domain = apiBase.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return `${domain}${cleanPath}`;
};

const getFileIcon = (mimeType, filename) => {
  const mime = mimeType?.toLowerCase() || '';
  const ext = filename?.split('.').pop()?.toLowerCase() || '';

  if (mime.includes('pdf') || ext === 'pdf') {
    return <FileText className="w-4 h-4 text-red-500" />;
  }
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') || ['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
  }
  if (mime.includes('word') || mime.includes('document') || ['docx', 'doc'].includes(ext)) {
    return <File className="w-4 h-4 text-blue-500" />;
  }
  if (mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
    return <Image className="w-4 h-4 text-indigo-500" />;
  }
  return <FileQuestion className="w-4 h-4 text-zinc-500" />;
};

const isImageAsset = (asset) => {
  const mime = String(asset?.mime_type || '').toLowerCase();
  const ext = String(asset?.original_filename || asset?.title || '').split('.').pop()?.toLowerCase() || '';
  return asset?.asset_type === 'image' || mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
};

const assetDownloadUrl = (asset) => asset?.download_url || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/articles/assets/${asset.id}/download`;

const sectionLabels = {
  introduction: 'Introduction',
  materials_and_methods: 'Materials and Methods',
  discussion: 'Discussion',
  supporting_information: 'Supporting Information',
  acknowledgements: 'Acknowledgements',
  references: 'References',
};

const compactDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ArticleDetail() {
  const params = useParams();
  const router = useRouter();
  const routeMagazineSlug = params?.articleSlug ? params.slug : null;
  const articleSlug = params?.articleSlug || params?.slug || null;
  
  const { toast } = useToast();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [authorMetrics, setAuthorMetrics] = useState(null);
  const [previousArticleId, setPreviousArticleId] = useState(null);
  const [nextArticleId, setNextArticleId] = useState(null);
  const [previousArticleSlug, setPreviousArticleSlug] = useState(null);
  const [nextArticleSlug, setNextArticleSlug] = useState(null);
  const [previousArticleTitle, setPreviousArticleTitle] = useState(null);
  const [nextArticleTitle, setNextArticleTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isPrimaryAuthor = user && article && article.user_id === user.id;
  const isCoAuthorEditor = user && article && article.article_authors?.some(
    author => author.user_id === user.id && author.can_edit
  );
  const showEditButton = (isPrimaryAuthor || isCoAuthorEditor) && isArticleEditableStatus(article?.status);
  const canonicalArticlePath = article ? publicArticlePath(article, articleSlug) : `/articles/${articleSlug || ''}`;
  
  const [downloading, setDownloading] = useState(false);

  // Sharing states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [embedCodeCopied, setEmbedCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [citationCopied, setCitationCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    toast('Link copied to clipboard!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);

    if (article) {
      api.post(`/articles/${article.id}/share-click`, { platform: 'copy_link' }).catch((err) => {
        logError('Failed to log share click:', err);
      });
    }
  };

  const getEmbedCode = () => {
    if (!article || typeof window === 'undefined') return '';
    return `<iframe src="${window.location.origin}${canonicalArticlePath}" width="100%" height="500" style="border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" title="${article.title}"></iframe>`;
  };

  const handleCopyEmbed = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(getEmbedCode());
    setEmbedCodeCopied(true);
    toast('Embed code copied to clipboard!', 'success');
    setTimeout(() => setEmbedCodeCopied(false), 2000);

    if (article) {
      api.post(`/articles/${article.id}/share-click`, { platform: 'copy_embed' }).catch((err) => {
        logError('Failed to log share click:', err);
      });
    }
  };

  const sharePlatforms = [
    { id: 'linkedin', name: 'LinkedIn', color: 'hover:bg-[#0077b5]/5 hover:text-[#0077b5]', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 .784-1.75 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg> },
    { id: 'twitter', name: 'Twitter/X', color: 'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { id: 'facebook', name: 'Facebook', color: 'hover:bg-[#1877f2]/5 hover:text-[#1877f2]', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/></svg> },
    { id: 'whatsapp', name: 'WhatsApp', color: 'hover:bg-[#25d366]/5 hover:text-[#25d366]', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
    { id: 'reddit', name: 'Reddit', color: 'hover:bg-[#ff4500]/5 hover:text-[#ff4500]', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.24-1.72l1.37-4.31 3.9 1.28 1.12 2.28 2.21 2.28 1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5c-1.09 0-2 .78-2.21 1.78l-4.21-1.1c-.26-.06-.54.1-.63.36l-1.63 5.13c-2.45.04-4.71.68-6.38 1.7-.56-.73-1.44-1.19-2.43-1.19-1.65 0-3 1.35-3 3 0 1.1.61 2.08 1.52 2.61-.06.28-.09.58-.09.89 0 3.73 4.29 6.75 9.5 6.75s9.5-3.02 9.5-6.75c0-.31-.03-.61-.09-.89.92-.52 1.54-1.5 1.54-2.61zm-17.5 1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm9 3.5c-.88.88-2.52.88-3.4 0-.15-.15-.15-.39 0-.54.15-.15.39-.15.54 0 .58.58 1.74.58 2.32 0 .15-.15.39-.15.54 0 .15.15.39 0 .54zm-.5-2c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z"/></svg> },
    { id: 'telegram', name: 'Telegram', color: 'hover:bg-[#0088cc]/5 hover:text-[#0088cc]', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.1-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.03.25z"/></svg> },
    { id: 'email', name: 'Email', color: 'hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200', icon: <Mail className="w-4 h-4" /> }
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
        setPreviousArticleId(response.data.previous_article_id);
        setNextArticleId(response.data.next_article_id);
        setPreviousArticleSlug(response.data.previous_article_slug);
        setNextArticleSlug(response.data.next_article_slug);
        setPreviousArticleTitle(response.data.previous_article_title);
        setNextArticleTitle(response.data.next_article_title);
      } catch (err) {
        logError('Failed to load article details', err);
        setError('The specified article could not be found or loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticleData();
  }, [articleSlug]);

  useEffect(() => {
    if (!article || routeMagazineSlug || !article.magazine?.slug) return;
    router.replace(publicArticlePath(article, articleSlug));
  }, [article, articleSlug, routeMagazineSlug, router]);

  const handlePdfDownload = async () => {
    if (!article?.has_pdf) {
      toast('No public PDF is available for this article.', 'info');
      return;
    }

    try {
      setDownloading(true);
      const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const fileUrl = `${baseApiUrl}/articles/${article.id}/download-pdf`;
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = `scholarlynest_${article.slug}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast('PDF file downloaded successfully.', 'success');
    } catch (err) {
      logError(err);
      toast('Failed to initialize PDF resource download.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const getCitationText = () => {
    if (!article) return '';
    const authorName = article.user?.name || 'Corresponding Author';
    const year = new Date(article.created_at).getFullYear();
    const volume = article.issue?.volume_number ? `Vol. ${article.issue.volume_number}` : '';
    const issue = article.issue?.issue_number ? `No. ${article.issue.issue_number}` : '';
    const pages = (article.page_start && article.page_end) ? `pp. ${article.page_start}-${article.page_end}` : '';
    const parts = ['ScholarlyNest', volume, issue, pages].filter(Boolean).join(', ');
    const doiPart = article.doi ? ` DOI: ${article.doi}` : '';
    const urlPart = typeof window !== 'undefined' ? ` Available at: ${window.location.href}` : '';
    return `${authorName} (${year}). "${article.title}". ${parts}.${doiPart}${urlPart}`;
  };

  const handleCopyCitation = () => {
    if (!article) return;
    navigator.clipboard.writeText(article.citation_text || getCitationText());
    setCitationCopied(true);
    toast('Citation copied to clipboard!', 'success');
    setTimeout(() => setCitationCopied(false), 2000);

    api.post(`/articles/${article.id}/share-click`, { platform: 'copy_citation' }).catch((err) => {
      logError('Failed to log share click:', err);
    });
  };

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
        logError('Failed to log share click:', err);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-sans font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider">
          Acquiring Research Metadata...
        </span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950/40">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
          <h2 className="font-serif text-2xl font-bold text-zinc-900 dark:text-white">Article Error</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{error || 'Article details could not be parsed.'}</p>
          <Link href={article?.magazine?.slug ? `/magazines/${article.magazine.slug}` : '/magazines'} className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-405 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Magazine</span>
          </Link>
        </div>
      </div>
    );
  }

  const articleImages = article.article_images || [];
  const supplementaryImageAssets = (article.assets || []).filter(isImageAsset);
  const articleGalleryImages = [
    ...articleImages.map((asset) => ({
      src: asset.download_url || assetDownloadUrl(asset),
      title: asset.title || asset.original_filename || article.title,
      caption: asset.caption,
      description: asset.description,
      alt: asset.title || asset.original_filename || article.title,
    })),
    ...supplementaryImageAssets.map((asset) => ({
      src: assetDownloadUrl(asset),
      title: asset.title || asset.original_filename || article.title,
      caption: asset.caption,
      description: asset.description,
      alt: asset.title || asset.original_filename || article.title,
    })),
  ];
  const supplementaryFiles = (article.assets || []).filter((asset) => !isImageAsset(asset));
  const allPublicationSections = (article.publication_sections || []).filter((section) => section.content_html);
  const publicationAbstract = allPublicationSections.find((section) => section.section_key === 'abstract');
  const abstractHtml = publicationAbstract?.content_html || article.abstract;
  const publicationSections = allPublicationSections.filter((section) => section.section_key !== 'abstract');
  const details = [
    article.open_access_label && { label: 'Access', value: article.open_access_label },
    article.is_peer_reviewed && { label: 'Review', value: 'Peer-reviewed' },
    article.academic_editor && { label: 'Academic Editor', value: article.academic_editor },
    article.received_at && { label: 'Received', value: compactDate(article.received_at) },
    article.accepted_at && { label: 'Accepted', value: compactDate(article.accepted_at) },
    article.published_at && { label: 'Published', value: compactDate(article.published_at) },
  ].filter(Boolean);

  const statementBlocks = [
    article.license_statement && { title: 'Copyright and License', body: article.license_statement },
    article.data_availability_statement && { title: 'Data Availability', body: article.data_availability_statement },
    article.funding_statement && { title: 'Funding', body: article.funding_statement },
    article.competing_interests_statement && { title: 'Competing Interests', body: article.competing_interests_statement },
    article.abbreviations && { title: 'Abbreviations', body: article.abbreviations },
  ].filter(Boolean);
  const contentNav = [
    abstractHtml && { id: 'abstract', label: 'Abstract' },
    article.seo_keywords && { id: 'keywords', label: 'Keywords' },
    ...publicationSections.map((section) => ({
      id: `section-${section.section_key}`,
      label: section.title || sectionLabels[section.section_key] || section.section_key.replaceAll('_', ' '),
    })),
    articleGalleryImages.length > 0 && { id: 'gallery', label: 'Gallery' },
    ((article.assets && article.assets.length > 0) || article.has_pdf) && { id: 'supplementary-assets', label: 'Supplementary Assets' },
    { id: 'citation', label: 'Citation' },
  ].filter(Boolean);
  const advertisementContext = {
    context: 'article',
    publication_type: article.magazine?.publication_type || 'magazine',
    publication_slug: article.magazine?.slug,
    article_slug: article.slug,
  };

  return (
    <div className="min-h-screen bg-zinc-50/20 dark:bg-zinc-950/10 pb-24 px-4 sm:px-6 lg:px-8 text-left">
      <SeoHead
        title={article.seo_title}
        description={article.seo_description}
        keywords={article.seo_keywords}
        ogImage={article.og_image}
        ogUrl={canonicalArticlePath}
        ogType="article"
      />

      <div className="w-full pt-4 sm:pt-6">
        
        {/* Navigation & Admin Action Header */}
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between mb-8">
          <Link 
            href={article.magazine?.slug ? `/magazines/${article.magazine.slug}` : '/magazines'}
            className="group inline-flex items-center space-x-2 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1 text-amber-500" />
            <span>Back to {article.magazine?.title || 'Magazine'}</span>
          </Link>
          
          {showEditButton && (
            <Link href={`/admin/articles/${article.id}/edit`}>
              <button className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-900 bg-amber-400 hover:bg-amber-500 border border-amber-500/20 shadow-sm transition-colors cursor-pointer">
                <FileText className="w-3.5 h-3.5" />
                <span>Edit Article</span>
              </button>
            </Link>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-[1440px] gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden space-y-6 pt-[192px] lg:sticky lg:top-24 lg:block lg:self-start">
            <nav className="rounded-2xl border border-zinc-150 bg-white/80 p-4 text-left shadow-sm dark:border-zinc-850 dark:bg-zinc-900/50" aria-label="Article sections">
              <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Sections</p>
              <div className="space-y-1">
                {contentNav.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="block rounded-lg px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-zinc-300 dark:hover:text-amber-300">
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
            <AdvertisementSlot placement="sidebar_sticky" context={advertisementContext} />
          </aside>

        {/* Centralized Reading Column */}
        <article className="min-w-0 bg-white/80 dark:bg-zinc-900/35 border border-zinc-100 dark:border-zinc-900/60 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm space-y-10">
          
          {/* 1. Magazine Context Banner */}
          {article.magazine && (
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                {(article.magazine.cover_image_url || article.magazine.cover_image) && (
                  <div className="w-10 h-14 rounded-lg overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shrink-0">
                    <img 
                      src={article.magazine.cover_image_url || getFullImageUrl(article.magazine.cover_image)}
                      alt={article.magazine.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="text-left min-w-0">
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono block mb-1">
                    Published in Magazine
                  </span>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {article.magazine.title}
                  </h4>
                  {article.issue && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Vol. {article.issue.volume_number}, Issue {article.issue.issue_number} ({article.issue.issue_year})
                    </span>
                  )}
                </div>
              </div>
              <Link 
                href={`/magazines/${article.magazine.slug}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[10px] font-sans font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-amber-500/10 transition-colors shrink-0"
              >
                <span>Browse Issue</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          )}

          {/* Featured Header Cover (Optional) */}
          {(article.featured_image_url || article.featured_image) && (
            <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden border border-zinc-200/40 dark:border-zinc-850 bg-zinc-50 shadow-sm relative group">
              <img 
                src={article.featured_image_url || getFullImageUrl(article.featured_image)}
                alt={article.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.01]" 
              />
            </div>
          )}

          {/* 2. Article Type */}
          <div className="text-left space-y-3">
            <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
              {article.article_type || 'Article'}
            </span>
            
            {/* 3. Title */}
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white leading-tight tracking-tight">
              {article.title}
            </h1>
            
            {/* 4. Subtitle */}
            {article.subtitle && (
              <p className="font-serif italic text-lg sm:text-xl text-zinc-650 dark:text-zinc-400 pt-2 border-l-2 border-amber-500/40 pl-4">
                {article.subtitle}
              </p>
            )}
          </div>

          {/* 5. Authors Section (Inline with details) */}
          <div className="border-y border-zinc-100 dark:border-zinc-800/80 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono block">
                Contributing Scholars
              </span>
              <AuthorHeaderBlock article={article} />
            </div>

            {/* Quick action controls inline */}
            <div className="flex flex-wrap gap-2.5">
              {article.has_pdf && (
                <button
                  onClick={handlePdfDownload}
                  disabled={downloading}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-950 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>PDF</span>
                </button>
              )}
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900/60 hover:bg-zinc-150 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* 6. Metadata */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
            {article.created_at && (
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                <span>Published: {new Date(article.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {article.doi && (
              <div className="flex items-center">
                <Info className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                <span className="normal-case">DOI: {article.doi}</span>
              </div>
            )}
            {(article.page_start && article.page_end) && (
              <div className="flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                <span>Pages: {article.page_start} - {article.page_end}</span>
              </div>
            )}
          </div>

          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {details.map((item) => (
                <div key={item.label} className="rounded-xl border border-zinc-150 bg-zinc-50/70 p-3 dark:border-zinc-850 dark:bg-zinc-950/30">
                  <span className="block text-[8px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{item.label}</span>
                  <span className="mt-1 block text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* 7. Abstract */}
          {abstractHtml && (
            <section id="abstract" className="scroll-mt-24 bg-zinc-50/50 dark:bg-zinc-900/10 p-6 sm:p-8 rounded-2xl border border-zinc-150 dark:border-zinc-850/80 text-left space-y-4">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Abstract
              </h3>
              <div 
                className="font-serif italic text-base sm:text-lg leading-relaxed text-zinc-700 dark:text-zinc-300 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: abstractHtml }}
              />
            </section>
          )}

          {/* 8. Keywords */}
          {article.seo_keywords && (
            <section id="keywords" className="scroll-mt-24 text-left space-y-2">
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono block">
                Keywords
              </span>
              <div className="flex flex-wrap gap-2">
                {article.seo_keywords.split(',').map((kw, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] font-sans font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-lg"
                  >
                    {kw.trim()}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 9. Full Text */}
          {article.full_text && (
            <div className="text-left space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Article Text
              </h3>
              <div 
                className="font-serif text-base sm:text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 prose dark:prose-invert max-w-none first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-amber-600 dark:first-letter:text-amber-400 first-letter:mr-2 first-letter:float-left first-letter:leading-none"
                dangerouslySetInnerHTML={{ __html: article.full_text }}
              />
            </div>
          )}

          {publicationSections.length > 0 && (
            <div className="space-y-8 border-t border-zinc-100 pt-8 text-left dark:border-zinc-800/80">
              {publicationSections.map((section) => (
                <section key={section.section_key} id={`section-${section.section_key}`} className="scroll-mt-24 space-y-3">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                    {section.title || sectionLabels[section.section_key] || section.section_key.replaceAll('_', ' ')}
                  </h3>
                  {section.image_url && (
                    <img src={section.image_url} alt={section.title || 'Publication section image'} className="max-h-[420px] w-full rounded-2xl border border-zinc-150 object-cover dark:border-zinc-850" />
                  )}
                  <div
                    className="prose prose-zinc max-w-none font-serif text-base leading-relaxed text-zinc-800 dark:prose-invert dark:text-zinc-200"
                    dangerouslySetInnerHTML={{ __html: section.content_html }}
                  />
                </section>
              ))}
            </div>
          )}

          {articleGalleryImages.length > 0 && (
            <section id="gallery" className="scroll-mt-24 space-y-4 border-t border-zinc-100 pt-8 text-left dark:border-zinc-800/80">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Gallery
              </h3>
              <ImageLightboxGallery images={articleGalleryImages} title="Article Images" />
            </section>
          )}

          {statementBlocks.length > 0 && (
            <div className="grid gap-4 border-t border-zinc-100 pt-8 text-left md:grid-cols-2 dark:border-zinc-800/80">
              {statementBlocks.map((item) => (
                <section key={item.title} className="rounded-2xl border border-zinc-150 bg-zinc-50/60 p-5 dark:border-zinc-850 dark:bg-zinc-950/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">{item.body}</p>
                </section>
              ))}
            </div>
          )}

          {/* 10. Citation block */}
          <section id="citation" className="scroll-mt-24 bg-amber-500/[0.01] dark:bg-amber-500/[0.005] border border-amber-500/15 p-6 rounded-2xl text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono flex items-center">
                <Clipboard className="w-3.5 h-3.5 mr-1.5" />
                How to Cite
              </span>
              <button
                onClick={handleCopyCitation}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all cursor-pointer"
              >
                {citationCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clipboard className="w-3 h-3" />}
                <span>{citationCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="font-sans text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 select-all">
              {article.citation_text || getCitationText()}
            </p>
          </section>

          {/* 11. PDF / Supplementary Assets List */}
          {((article.assets && article.assets.length > 0) || article.has_pdf) && (
            <section id="supplementary-assets" className="scroll-mt-24 border-t border-zinc-100 dark:border-zinc-800/80 pt-8 text-left space-y-4">
              <h3 className="font-serif text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                Supplementary Assets
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF Main Download Asset Card */}
                {article.has_pdf && (
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-800/80 p-5 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          Pre-compiled PDF
                        </h4>
                        <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider font-mono">
                          DOCUMENT
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handlePdfDownload}
                      disabled={downloading}
                      className="p-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-amber-600 dark:hover:bg-amber-400 hover:text-white dark:hover:text-zinc-950 transition-colors cursor-pointer"
                    >
                      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Supplementary Assets files list */}
                {supplementaryFiles.map((asset) => {
                  const downloadUrl = assetDownloadUrl(asset);
                  return (
                    <div key={asset.id} className="space-y-3 rounded-2xl border border-zinc-200/60 bg-zinc-50/50 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/20">
                      <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 shrink-0">
                          {getFileIcon(asset.mime_type, asset.original_filename)}
                        </div>
                        <div className="text-left min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate" title={asset.original_filename}>
                            {asset.original_filename}
                          </h4>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wider font-mono">
                            SUPPLEMENTARY FILE
                          </span>
                        </div>
                      </div>
                      <a
                        href={downloadUrl}
                        download
                        className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 hover:bg-amber-600 dark:hover:bg-amber-400 text-zinc-600 dark:text-zinc-350 hover:text-white dark:hover:text-zinc-950 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sequential Navigation Pagination */}
          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-8 mt-8">
            <ArticlePagination
              previousArticleId={previousArticleId}
              nextArticleId={nextArticleId}
              previousArticleSlug={previousArticleSlug}
              nextArticleSlug={nextArticleSlug}
              previousArticleTitle={previousArticleTitle}
              nextArticleTitle={nextArticleTitle}
              magazineSlug={article.magazine?.slug}
            />
          </div>

        </article>
        <AdvertisementSlot placement="sidebar_sticky" context={advertisementContext} className="lg:hidden" />
        </div>

      </div>

      {/* Share details modal overlay */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsShareModalOpen(false)}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
          />
          <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col font-sans max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
              <div className="text-left space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">Disseminate Research</span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase leading-none">Share & Citation Details</h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)} 
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow text-left">
              <div className="space-y-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Social Channels</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sharePlatforms.map((platform) => (
                    <button
                       key={platform.id}
                       onClick={() => handleSocialShare(platform.id)}
                       className={`flex items-center space-x-2.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-350 text-xs font-bold tracking-wide transition-all cursor-pointer ${platform.color}`}
                    >
                      <span className="shrink-0">{platform.icon}</span>
                      <span className="truncate">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Article URL</span>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? window.location.href : ''}
                      className="flex-grow text-[11px] font-semibold px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-zinc-850 hover:bg-zinc-950 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {linkCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono block">Academic Citation</span>
                  <button
                    onClick={handleCopyCitation}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-150 border border-zinc-250 dark:border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Clipboard className="w-3.5 h-3.5 text-amber-600" />
                    <span>Copy Citation</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-mono flex items-center">
                    <Code className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Iframe Embed HTML Code
                  </span>
                  <button
                    onClick={handleCopyEmbed}
                    className="text-[9px] font-bold uppercase text-amber-600 hover:underline cursor-pointer"
                  >
                    {embedCodeCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={getEmbedCode()}
                  rows={2}
                  className="w-full font-mono text-[10px] p-3 bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/40"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
