import React from 'react';
import YearArchiveBlock from './YearArchiveBlock';

export default function TableOfContents({ groupedArticles, magazineSlug, onArticleClick }) {
  return (
    <YearArchiveBlock
      groupedArticles={groupedArticles || {}}
      magazineSlug={magazineSlug}
      onArticleClick={onArticleClick}
    />
  );
}
