import * as React from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { URL_PARAMS_KEY_TAGS } from '@/common/constants';
import { actions as tagsActions } from '@/slices/tags';

/**
 * currently, we can find target element accurately this way,
 * since we are using MuiCard('@mui/material/Card') as the base component of our Card component.
 * if any relate structure of component modified in the future, please do the change accordingly
 */
const CARD_SELECTOR_PATH =
  '.MuiCardContent-root div[style="cursor: pointer; caret-color: transparent;"], .MuiCardContent-root div[style="cursor: auto; caret-color: transparent;"]';

const useTags = (tagList = []) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { tagsOnVisibleCards = [] } = useSelector(state => state.tags);
  const [alreadyGetElement, setGetElement] = React.useState(false);

  const getTagsFromUrl = React.useCallback(() => {
    const currentQueryParam = location.search ? new URLSearchParams(location.search) : new URLSearchParams();
    const tagNamesFromUrl = currentQueryParam.getAll(URL_PARAMS_KEY_TAGS)?.filter(tag => tag !== '');
    return [...new Set(tagNamesFromUrl)];
  }, [location.search]);

  const selectedTags = React.useMemo(() => {
    return getTagsFromUrl();
  }, [getTagsFromUrl]);

  const getTagIdsFromUrl = React.useCallback(() => {
    const tags = getTagsFromUrl();
    return tagList
      .filter(item => tags.includes(item.name))
      .map(item => item.id)
      .join(',');
  }, [getTagsFromUrl, tagList]);

  const selectedTagIds = React.useMemo(() => {
    return getTagIdsFromUrl();
  }, [getTagIdsFromUrl]);
  const navigate = useNavigate();

  const navigateWithTags = React.useCallback(
    tags => {
      const currentQueryParam = location.search
        ? new URLSearchParams(location.search)
        : new URLSearchParams();
      currentQueryParam.delete(URL_PARAMS_KEY_TAGS);
      if (tags.length > 0) {
        for (const tag of tags) {
          currentQueryParam.append(URL_PARAMS_KEY_TAGS, tag);
        }
      }

      navigate(
        {
          pathname: location.pathname,
          search: currentQueryParam.toString(),
        },
        { replace: true, state: location.state },
      );
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const updateTagInUrl = React.useCallback(
    newTag => {
      const isExistingTag = selectedTags.includes(newTag);
      const tags = isExistingTag ? selectedTags.filter(tag => tag !== newTag) : [...selectedTags, newTag];

      navigateWithTags(tags);
    },
    [navigateWithTags, selectedTags],
  );

  const handleClickTag = React.useCallback(
    (e, tag) => {
      // Support both direct click (e.target.innerText) and tag object parameter
      // to ensure consistent URL generation regardless of click source
      const newTag = tag ? tag.name : e.target.innerText;
      if (tag) {
        dispatch(
          tagsActions.insertTagToTagList({
            tag,
          }),
        );
      }
      updateTagInUrl(newTag, selectedTags);
    },
    [updateTagInUrl, selectedTags, dispatch],
  );

  const handleClear = React.useCallback(() => {
    navigateWithTags([]);
  }, [navigateWithTags]);

  // record all tags into Redux with their width by creating a tempContainer.
  // it will run everytime when tagList changes
  const calculateTagsWidthOnCard = React.useCallback(() => {
    // TODO: find a more general way to filter out target element, or import component
    const renderedTagContainer = document.querySelector(CARD_SELECTOR_PATH);
    // prevent unnecessary calculation
    // no need to calculate when:
    //   1. yet tag container template hasn't been rendered(renderedTagContainer)
    //   2. already have gotten tag container template.
    //   3. tagList is empty, which means either there could be no data, or yet hasn't fetched from server
    if (!renderedTagContainer || alreadyGetElement || !tagsOnVisibleCards.length) return;

    const tagWidthOnCard = {};
    const htmlBody = document.body;
    const clonedElement = renderedTagContainer.cloneNode(true);
    const textContent = clonedElement.textContent;

    const tempContainer = document.createElement('div');
    tempContainer.id = 'temp-container';
    tempContainer.style.display = 'flex';
    htmlBody.appendChild(tempContainer);

    tagsOnVisibleCards.forEach(tag => {
      const { name = '' } = tag;
      const updatedElement = clonedElement.outerHTML.replace(`>${textContent}<`, `>${name}<`);
      tempContainer.innerHTML = updatedElement;
      const currentTagWidthOnCard = tempContainer.firstChild.getBoundingClientRect().width;
      tagWidthOnCard[name] = Math.round(currentTagWidthOnCard);
    });

    htmlBody.removeChild(tempContainer);
    dispatch(
      tagsActions.updateTagWidthOnCard({
        tagWidthOnCard,
      }),
    );
    setGetElement(true);
  }, [alreadyGetElement, tagsOnVisibleCards, dispatch]);

  return {
    selectedTags,
    selectedTagIds,
    handleClickTag,
    handleClear,
    navigateWithTags,
    calculateTagsWidthOnCard,
    setGetElement,
  };
};

export const calculateOneTagWidthOnCard = (tag, maxWidth) => {
  if (!tag || !tag.name || !maxWidth) {
    return {
      name: tag?.name || '',
      width: 0,
    };
  }
  const renderedTagContainer = document.querySelector(CARD_SELECTOR_PATH);
  if (!renderedTagContainer) {
    return {
      name: tag.name || '',
      width: 0,
    };
  }
  const htmlBody = document.body;
  const clonedElement = renderedTagContainer.cloneNode(true);
  const textContent = clonedElement.textContent;
  let currentTagWidthOnCard = 0;
  const tempContainer = document.createElement('div');
  tempContainer.id = 'temp-container';
  tempContainer.style.display = 'flex';
  htmlBody.appendChild(tempContainer);

  let name = tag.name || '';
  let count = 3;
  // eslint-disable-next-line no-constant-condition
  while (1) {
    const updatedElement = clonedElement.outerHTML.replace(`>${textContent}<`, `>${name}<`);
    tempContainer.innerHTML = updatedElement;
    currentTagWidthOnCard = tempContainer.firstChild.getBoundingClientRect().width;
    if (currentTagWidthOnCard <= maxWidth) {
      break;
    } else {
      // if the tag's width is larger than maxWidth, we will shorten the tag name
      // by replacing the last three character with '...' until it fits
      name = tag.name.slice(0, -count) + '...';
      if (name.length <= 3) {
        // if the tag name is too short, we will just return the original tag name
        currentTagWidthOnCard = tempContainer.firstChild.getBoundingClientRect().width;
        break;
      }
      count += 1;
    }
  }
  htmlBody.removeChild(tempContainer);
  return {
    name,
    width: Math.round(currentTagWidthOnCard),
  };
};

export default useTags;
