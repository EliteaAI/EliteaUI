import { URL_PARAMS_KEY_TAGS } from './constants';

export const newlyFetchedTags = fetchedEntities => {
  return fetchedEntities.reduce((newlyFetchedTagsList, entity) => {
    const tags = entity.tags || [];
    tags.forEach(tag => {
      newlyFetchedTagsList.push(tag);
    });
    return newlyFetchedTagsList;
  }, []);
};

export const uniqueTagsByName = (tags = []) => {
  return Object.values(
    tags.reduce((uniqueTags, tag) => {
      if (!uniqueTags[tag.name]) {
        uniqueTags[tag.name] = tag;
      }
      return uniqueTags;
    }, {}),
  );
};

export const getTagsFromUrl = () => {
  const currentQueryParam = location.search ? new URLSearchParams(location.search) : new URLSearchParams();
  const tagNamesFromUrl = currentQueryParam.getAll(URL_PARAMS_KEY_TAGS)?.filter(tag => tag !== '');
  return [...new Set(tagNamesFromUrl)];
};
