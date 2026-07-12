const placementMap = {
  sidebar_sticky: ['Sticky Sidebar', '300×250 recommended'],
  content_top: ['Content Top', '970×250 or 728×90 recommended'],
  content_bottom: ['Content Bottom', '970×250 or 728×90 recommended'],
  header_banner: ['Header Banner', '970×250 recommended'],
  footer_banner: ['Footer Banner', '970×250 or 728×90 recommended'],
};

export function formatAdvertisementPlacement(value) {
  const [label, helper] = placementMap[value] || [String(value || '').replaceAll('_', ' '), ''];
  return { label, helper };
}

export function formatAdvertisementStatus(advertisement) {
  const now = Date.now();
  if (advertisement.ends_at && new Date(advertisement.ends_at).getTime() < now) return { label: 'Expired', tone: 'zinc' };
  if (advertisement.status === 'active' && advertisement.starts_at && new Date(advertisement.starts_at).getTime() > now) return { label: 'Scheduled', tone: 'blue' };
  return { label: advertisement.status?.replaceAll('_', ' ') || 'Unknown', tone: advertisement.status === 'active' ? 'green' : advertisement.status === 'draft' ? 'amber' : 'zinc' };
}

export function formatAdvertisementSchedule(advertisement) {
  const format = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  if (!advertisement.starts_at && !advertisement.ends_at) return ['Always active'];
  return [advertisement.starts_at && `Starts: ${format(advertisement.starts_at)}`, advertisement.ends_at && `Ends: ${format(advertisement.ends_at)}`].filter(Boolean);
}

export function formatAdvertisementTargetSummary(targets = []) {
  if (!targets.length) return { heading: 'No targets', lines: [] };
  const first = targets[0];
  const publications = [...new Set(targets.map((target) => target.publication_name).filter(Boolean))];
  const pages = [...new Set(targets.map((target) => target.page_label || target.page_key).filter(Boolean))];
  const articles = [...new Set(targets.map((target) => target.article_title).filter(Boolean))];
  const typeLabel = first.publication_type === 'journal' ? 'Journal' : 'Magazine';
  const heading = first.target_area === 'website' ? 'Website Pages' : `${typeLabel} ${first.target_area === 'article' ? 'Articles' : 'Pages'}`;
  const lines = [];
  if (publications.length === 1) lines.push(`${typeLabel} · ${publications[0]}`);
  else if (publications.length > 1) lines.push(`${publications.length} ${typeLabel.toLowerCase()}s selected`);
  if (first.target_mode === 'all_articles') lines.push('All published articles');
  else if (first.target_mode === 'all_pages') lines.push('All pages');
  else if (articles.length) lines.push(`${articles.length} published article${articles.length === 1 ? '' : 's'} selected`);
  else if (pages.length) lines.push(pages.slice(0, 3).join(', ') + (pages.length > 3 ? ` +${pages.length - 3} more` : ''));
  return { heading, lines, publications, pages, articles };
}
