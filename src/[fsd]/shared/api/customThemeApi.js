import { eliteaApi } from '@/api/eliteaApi.js';

const CUSTOM_THEME_TAG = 'CUSTOM_THEME_TAG';

export const customThemeApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [CUSTOM_THEME_TAG],
  })
  .injectEndpoints({
    endpoints: build => ({
      // Fetches the custom theme palette and logo from the backend.
      // Response shape:
      // {
      //   palette: object | null — same structure as darkPalette / lightPalette (incl. `mode`), may be partial,
      //   logo_url: string | null — image URL used for favicon, sidebar and other brand logo places,
      // }
      getCustomTheme: build.query({
        query: () => ({
          url: '/admin/custom_theme/prompt_lib',
        }),
        transformResponse: response => ({
          palette: response.palette || null,
          logo: response.logo_url || null,
        }),
        providesTags: [CUSTOM_THEME_TAG],
      }),
    }),
  });

export const { useGetCustomThemeQuery } = customThemeApi;
