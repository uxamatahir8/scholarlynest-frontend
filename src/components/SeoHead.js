import React from 'react';

const DEFAULT_OG_IMAGE = '/logo.png'; // ScholarlyNest logo fallback

export default function SeoHead({ title, description, keywords, ogImage, ogUrl, ogType }) {
  const resolvedImage = ogImage || DEFAULT_OG_IMAGE;
  const frontendUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  
  // Ensure image and URL are absolute and correctly formatted
  const fullOgImage = resolvedImage.startsWith('http') 
    ? resolvedImage 
    : `${frontendUrl}${resolvedImage.startsWith('/') ? '' : '/'}${resolvedImage}`;
  
  const fullOgUrl = ogUrl 
    ? (ogUrl.startsWith('http') ? ogUrl : `${frontendUrl}${ogUrl.startsWith('/') ? '' : '/'}${ogUrl}`) 
    : '';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType || 'website'} />
      <meta property="og:image" content={fullOgImage} />
      {fullOgUrl && <meta property="og:url" content={fullOgUrl} />}
      <meta property="og:site_name" content="ScholarlyNest" />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Canonical */}
      {fullOgUrl && <link rel="canonical" href={fullOgUrl} />}
    </>
  );
}
