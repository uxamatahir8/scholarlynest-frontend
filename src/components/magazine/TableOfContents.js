import React from 'react';
import YearArchiveBlock from './YearArchiveBlock';

export default function TableOfContents({ archive, magazineSlug, onArticleClick }) {
  return (
    <YearArchiveBlock
      archive={archive || {}}
      magazineSlug={magazineSlug}
      onArticleClick={onArticleClick}
    />
  );
}
