import { eliteaApi } from './eliteaApi.js';

const apiSlicePath = '/elitea_core';
const apiSlicePathForDatasource = '/datasources';
const TAG_TYPE_AUTHOR = 'Author';
const TAG_TYPE_AUTHOR_DETAIL = 'AuthorDetail';

export const trendingAuthor = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_TYPE_AUTHOR],
  })
  .injectEndpoints({
    endpoints: build => ({
      trendingAuthorsList: build.query({
        query: projectId => ({
          url: apiSlicePath + '/trending_authors/prompt_lib/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.map(i => ({ type: TAG_TYPE_AUTHOR, id: i.id }));
        },
      }),
      applicationTrendingAuthorsList: build.query({
        query: projectId => ({
          url: apiSlicePath + '/trending_authors/prompt_lib/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.map(i => ({ type: TAG_TYPE_AUTHOR, id: i.id }));
        },
      }),
      datasourceTrendingAuthorsList: build.query({
        query: projectId => ({
          url: apiSlicePathForDatasource + '/trending_authors/prompt_lib/' + projectId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return result?.map(i => ({ type: TAG_TYPE_AUTHOR, id: i.id }));
        },
      }),
      trendingAuthorsDetails: build.query({
        query: authorId => ({
          url: apiSlicePath + '/author/prompt_lib/' + authorId,
        }),
        providesTags: (result, error) => {
          if (error) {
            return [];
          }
          return [{ type: TAG_TYPE_AUTHOR_DETAIL, id: result.id }];
        },
      }),
    }),
  });

export const {
  useTrendingAuthorsListQuery,
  useTrendingAuthorsDetailsQuery,
  useLazyTrendingAuthorsDetailsQuery,
  useApplicationTrendingAuthorsListQuery,
  useDatasourceTrendingAuthorsListQuery,
} = trendingAuthor;
