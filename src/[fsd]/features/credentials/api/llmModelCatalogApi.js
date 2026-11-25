import { eliteaApi } from '@/api';

const llmModelCatalogApi = eliteaApi.injectEndpoints({
  endpoints: build => ({
    llmModelCatalog: build.query({
      // An unavailable gateway answers 200 with no models; as an error it is asked again on the next form open
      query: ({ projectId }) => ({
        url: `/configurations/llm_model_catalog/${projectId}`,
        validateStatus: (response, catalog) =>
          response.status === 200 && Object.keys(catalog?.models ?? {}).length > 0,
      }),
      keepUnusedDataFor: 3600,
    }),
  }),
});

export const { useLlmModelCatalogQuery } = llmModelCatalogApi;
