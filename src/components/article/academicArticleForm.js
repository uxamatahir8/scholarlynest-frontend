export const emptyAcademicMetadata = {
  articleCategory: '',
  articleType: '',
  subjectArea: '',
  language: 'English',
  ethicalApprovalStatement: '',
  conflictOfInterestStatement: '',
  fundingStatement: '',
  dataAvailabilityStatement: '',
  authorContributionStatement: '',
};

export function createEmptyAuthor(order = 1) {
  return {
    name: '',
    email: '',
    affiliation: '',
    university_name: '',
    department: '',
    country: '',
    orcid: '',
    author_order: order,
    is_owner: false,
    is_corresponding: false,
    contribution_statement: '',
    can_edit: false,
    create_account: false,
  };
}

export function currentUserAuthor(user) {
  return {
    ...createEmptyAuthor(1),
    name: user?.name || '',
    email: user?.email || '',
    affiliation: user?.university_name || '',
    university_name: user?.university_name || '',
    is_owner: true,
    is_corresponding: true,
    can_edit: true,
  };
}

export function normalizeAuthorRows(authors) {
  return (authors || [])
    .map((author, index) => ({
      ...createEmptyAuthor(index + 1),
      ...author,
      affiliation: author.affiliation || author.university_name || '',
      university_name: author.affiliation || author.university_name || '',
      email: (author.email || '').trim().toLowerCase(),
      author_order: index + 1,
      is_owner: !!author.is_owner,
      is_corresponding: !!author.is_corresponding,
      can_edit: !!author.can_edit,
      create_account: !!author.create_account,
    }));
}

export function validateAuthors(authors, { isSuperAdmin, user }) {
  const errors = {};
  const normalized = normalizeAuthorRows(authors).filter(author => author.name.trim() || author.email.trim());
  const emails = normalized.map(author => author.email).filter(Boolean);

  if (isSuperAdmin) {
    if (normalized.length === 0) {
      errors.coAuthors = 'At least one author is required.';
    }

    const ownerCount = normalized.filter(author => author.is_owner).length;
    if (ownerCount !== 1) {
      errors.coAuthors = 'Exactly one article owner is required.';
    }

    if (normalized.filter(author => author.is_corresponding).length < 1) {
      errors.coAuthors = 'At least one corresponding author is required.';
    }
  }

  if (emails.length !== new Set(emails).size) {
    errors.coAuthors = 'Author emails must be unique.';
  }

  return errors;
}

export function appendAcademicMetadata(formData, metadata) {
  formData.append('article_category', metadata.articleCategory || '');
  formData.append('article_type', metadata.articleType || '');
  formData.append('subject_area', metadata.subjectArea || '');
  formData.append('language', metadata.language || '');
  formData.append('ethical_approval_statement', metadata.ethicalApprovalStatement || '');
  formData.append('conflict_of_interest_statement', metadata.conflictOfInterestStatement || '');
  formData.append('funding_statement', metadata.fundingStatement || '');
  formData.append('data_availability_statement', metadata.dataAvailabilityStatement || '');
  formData.append('author_contribution_statement', metadata.authorContributionStatement || '');
}
