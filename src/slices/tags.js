import { alitaApi } from '@/api/alitaApi.js';
import { getTagsFromUrl, newlyFetchedTags, uniqueTagsByName } from '@/common/tagUtils';
import { removeDuplicateObjects } from '@/common/utils';
import { createSlice } from '@reduxjs/toolkit';

const tagsSlice = createSlice({
  name: 'tags',
  initialState: {
    tagList: [],
    tagsOnVisibleCards: [],
    tagWidthOnCard: {},
    totalTags: 0,
    currentCardWidth: 0,
  },
  reducers: {
    updateTagWidthOnCard: (state, action) => {
      const { tagWidthOnCard = {} } = action.payload;
      state.tagWidthOnCard = { ...tagWidthOnCard, ...state.tagWidthOnCard };
    },
    updateCardWidth: (state, action) => {
      const { cardWidth = 0 } = action.payload;
      state.currentCardWidth = cardWidth;
    },
    setVisibleTags: (state, action) => {
      const { tags = [] } = action.payload;
      state.tagsOnVisibleCards = uniqueTagsByName(tags);
    },
    insertTagToTagList: (state, action) => {
      const { tag } = action.payload;
      const isTagExist = state.tagList.some(oldTag => {
        const { id } = oldTag;
        return tag?.id === id;
      });

      if (!isTagExist) {
        state.tagList = [tag, ...state.tagList];
      }
    },
  },
  extraReducers: builder => {
    builder.addMatcher(alitaApi.endpoints.tagList.matchFulfilled, (state, { payload }) => {
      let validTags = [];
      const { rows, total, isLoadMore, skipTotal = false } = payload;
      const storedTagsFromUrl = getTagsFromUrl().map(urlTag => {
        let remainTag;
        state.tagList.some(tag => {
          if (tag.name === urlTag) {
            remainTag = tag;
            return true;
          }
        });
        return remainTag;
      });
      if (isLoadMore || skipTotal) {
        validTags = [...storedTagsFromUrl, ...state.tagList, ...rows].filter(tag => tag);
      } else {
        validTags = [...storedTagsFromUrl, ...rows].filter(tag => tag);
      }
      state.tagList = removeDuplicateObjects(validTags);
      if (skipTotal) return;
      state.totalTags = total;
    });

    builder.addMatcher(alitaApi.endpoints.publicApplicationsList.matchFulfilled, (state, { payload }) => {
      const { rows = [] } = payload;
      state.tagsOnVisibleCards = uniqueTagsByName(newlyFetchedTags(rows));
    });
    builder.addMatcher(alitaApi.endpoints.applicationList.matchFulfilled, (state, { payload }) => {
      const { rows = [] } = payload;
      state.tagsOnVisibleCards = uniqueTagsByName(newlyFetchedTags(rows));
    });
  },
});

export const { name, actions } = tagsSlice;
export default tagsSlice.reducer;
