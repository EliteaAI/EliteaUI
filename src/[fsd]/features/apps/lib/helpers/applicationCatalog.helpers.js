const getSearchableTexts = application => [
  application.name,
  application.typeLabel,
  application.shortDescription,
  application.bestFor,
  ...(application.capabilities || []),
];

export const filterApplicationsByQuery = (applications = [], query = '') => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return applications;

  return applications.filter(application =>
    getSearchableTexts(application).some(text => text?.toLowerCase().includes(normalizedQuery)),
  );
};
