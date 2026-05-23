'use client';

import React, { useState, useEffect } from 'react';
import { Database, FileCode, CheckCircle, HelpCircle, Layers, Code } from 'lucide-react';
import PageBanner from '../../components/PageBanner';
import api from '../../utils/api';

export default function ManifestsPage() {
  const [activeSchema, setActiveSchema] = useState('highwire');
  const [dynamicHtml, setDynamicHtml] = useState(null);

  useEffect(() => {
    let active = true;
    api.get('/cms/manifests')
      .then(res => {
        if (active && res.data && res.data.content_html) {
          setDynamicHtml(res.data.content_html);
        }
      })
      .catch(err => {
        console.warn('CMS manifests dynamic load fallback used:', err.message);
      });
    return () => { active = false; };
  }, []);

  const schemas = {
    highwire: {
      title: "Google Scholar (Highwire Press)",
      desc: "Injected dynamically into the HTML head tag of blogs. Enables Google Scholar crawler bots to parse citation lists, author networks, and publication timelines instantly.",
      code: `<head>
  <meta name="citation_title" content="Quantum Catalyst Optimization Models" />
  <meta name="citation_author" content="Vance, Alistair" />
  <meta name="citation_author" content="Lovelace, Sophia" />
  <meta name="citation_publication_date" content="2026/05/16" />
  <meta name="citation_journal_title" content="ScholarlyNest Physical Journals" />
  <meta name="citation_volume" content="14" />
  <meta name="citation_pdf_url" content="https://dev.scholarlynest.com/storage/pdfs/v14_catalysts.pdf" />
</head>`
    },
    jsonld: {
      title: "Schema.org (ScholarlyArticle)",
      desc: "Structured JSON-LD block injected at the bottom of the body tag. Resolves search-engine semantic connections and powers rich snippet cards in Google, Bing, and DuckDuckGo search indexes.",
      code: `{
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline": "Algorithmic Diagnostic Bias in Healthcare Diagnostics",
  "author": [
    {
      "@type": "Person",
      "name": "Dr. Sophia Patel",
      "affiliation": "Stanford University Research Institute"
    }
  ],
  "datePublished": "2026-05-16",
  "headline": "Algorithmic Diagnostic Bias in Healthcare Diagnostics",
  "publisher": {
    "@type": "Organization",
    "name": "ScholarlyNest Platform Inc.",
    "logo": "https://dev.scholarlynest.com/assets/logo.png"
  },
  "citation": "https://doi.org/10.1016/j.diagnostics.2026.04.012"
}`
    },
    crossref: {
      title: "CrossRef DOI Schema",
      desc: "XML metadata payload transmitted to the CrossRef registry to allocate unique Digital Object Identifiers (DOIs). Maps citation relations and preserves digital archives.",
      code: `<?xml version="1.0" encoding="UTF-8"?>
<doi_batch version="4.4.2" xmlns="http://www.crossref.org/schema/4.4.2">
  <head>
    <doi_batch_id>scholarlynest_17789736829</doi_batch_id>
    <timestamp>202605162356</timestamp>
    <depositor_name>ScholarlyNest Press</depositor_name>
  </head>
  <body>
    <journal_article publication_type="full_text">
      <titles>
        <title>Multi-Decadal Global Carbon Cycle Simulations</title>
      </titles>
      <doi_data>
        <doi>10.5555/scholarlynest.2026.14.2.118</doi>
        <resource>https://dev.scholarlynest.com/blogs/carbon-simulations</resource>
      </doi_data>
    </journal_article>
  </body>
</doi_batch>`
    }
  };

  return (
    <div className="bg-[var(--background)] min-height-screen pb-12 transition-premium">
      <title>Metadata Manifests  - ScholarlyNest</title>
      <PageBanner 
        title="Metadata Manifests" 
        description="Dynamic schema injection engines configured for global international academic indexation and open search compliance."
        customLabels={{ manifests: 'Metadata Manifests' }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* INTRODUCTION BLOCK */}
        <div className="bg-white dark:bg-[#121211] p-6 border border-zinc-200/80 dark:border-zinc-800/60 rounded-lg shadow-sm mb-10">
          {dynamicHtml ? (
            <div 
              className="prose dark:prose-invert max-w-none text-xs text-zinc-550 dark:text-zinc-400"
              dangerouslySetInnerHTML={{ __html: dynamicHtml }}
            />
          ) : (
            <>
              <h3 className="font-serif text-sm font-bold text-zinc-900 dark:text-white mb-3">
                Open Archives Initiative (OAI-PMH) Compliance
              </h3>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
                ScholarlyNest implements full semantic schema standards to ensure scientific blogs published on the platform are immediately indexable. Our headless engine automatically parses Tippy WYSIWYG outputs, attaches references, and injects structural headers dynamically.
              </p>
            </>
          )}
        </div>

        {/* SCHEMA SELECTOR TABS */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 space-x-6 text-xs font-bold uppercase tracking-wider mb-6">
          <button
            onClick={() => setActiveSchema('highwire')}
            className={`pb-3 focus:outline-none transition-colors ${
              activeSchema === 'highwire' 
                ? 'border-b-2 border-zinc-850 text-zinc-900 dark:border-zinc-200 dark:text-white' 
                : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-400'
            }`}
          >
            Google Scholar (Highwire)
          </button>
          <button
            onClick={() => setActiveSchema('jsonld')}
            className={`pb-3 focus:outline-none transition-colors ${
              activeSchema === 'jsonld' 
                ? 'border-b-2 border-zinc-850 text-zinc-900 dark:border-zinc-200 dark:text-white' 
                : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-400'
            }`}
          >
            Schema.org (JSON-LD)
          </button>
          <button
            onClick={() => setActiveSchema('crossref')}
            className={`pb-3 focus:outline-none transition-colors ${
              activeSchema === 'crossref' 
                ? 'border-b-2 border-zinc-850 text-zinc-900 dark:border-zinc-200 dark:text-white' 
                : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-400'
            }`}
          >
            CrossRef XML
          </button>
        </div>

        {/* ACTIVE SCHEMA DISPLAY VIEW */}
        <div className="space-y-4">
          <div className="p-5 bg-zinc-100 dark:bg-zinc-900/40 rounded-lg border border-zinc-200 dark:border-zinc-800/60">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>{schemas[activeSchema].title}</span>
            </h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-2.5 leading-relaxed">
              {schemas[activeSchema].desc}
            </p>
          </div>

          {/* CODE HIGHLIGHT BOX */}
          <div className="relative group">
            <span className="absolute right-3 top-3 text-[9px] font-mono text-zinc-400 uppercase tracking-wider bg-white/70 dark:bg-zinc-950/70 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
              {activeSchema === 'crossref' ? 'XML' : activeSchema === 'jsonld' ? 'JSON' : 'HTML'}
            </span>
            <pre className="p-6 bg-zinc-900 text-zinc-100 rounded-lg border border-zinc-850 overflow-x-auto text-[11px] font-mono leading-relaxed shadow-sm">
              <code>{schemas[activeSchema].code}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
