import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('shared magazine and journal cards render the complete A4 cover', () => {
  const card = source('../src/components/magazine/MagazineCard.js');
  const magazines = source('../src/components/ui/MagazineCarousel.js');
  const journals = source('../src/components/ui/JournalCarousel.js');

  assert.match(card, /aspect-\[1\/1\.414\]/);
  assert.match(card, /className="h-full w-full object-contain"/);
  assert.doesNotMatch(card, /object-cover/);
  assert.match(magazines, /<MagazineCard/);
  assert.match(journals, /<MagazineCard/);
});

test('publication inner pages contain covers while banners retain banner cropping', () => {
  const layout = source('../src/app/magazines/[slug]/layout.js');
  const journalLayout = source('../src/app/journals/[slug]/layout.js');
  const article = source('../src/app/articles/[slug]/page.js');

  assert.match(layout, /aspect-\[1\/1\.414\]/);
  assert.match(layout, /bannerImage \? 'object-cover' : 'object-contain'/);
  assert.match(layout, /alt=\{`\$\{magazine\.title\} cover`\} className="h-full w-full object-contain"/);
  assert.match(journalLayout, /magazines\/\[slug\]\/layout/);
  assert.match(article, /data-testid="article-publication-cover"[\s\S]*?className="h-full w-full object-contain"/);
});

test('cover previews and issue tiles preserve the complete A4 artwork', () => {
  const form = source('../src/components/admin/publication/MagazineFormDialog.js');
  const issues = source('../src/components/admin/publication/IssueWorkspace.js');
  const issueCard = source('../src/components/magazine/MonthVolumeCard.js');

  assert.match(form, /Recommended A4 portrait image/);
  assert.match(form, /aspectClass="aspect-\[1\/1\.414\]" objectFit="contain"/);
  assert.match(issues, /aspect-\[1\/1\.414\]/);
  assert.match(issues, /className="h-full w-full object-contain"/);
  assert.match(issueCard, /aspect-\[1\/1\.414\]/);
  assert.match(issueCard, /object-contain/);
});
