import { eliteaApi } from '@/api/eliteaApi.js';

const TAG_PLATFORM_BANNERS = 'PlatformBanners';
const API_PATH = '/social';
const BANNER_MODE = 'default';

const platformBannersApi = eliteaApi
  .enhanceEndpoints({
    addTagTypes: [TAG_PLATFORM_BANNERS],
  })
  .injectEndpoints({
    endpoints: build => ({
      getPlatformBanners: build.query({
        query: () => ({
          url: `${API_PATH}/banners/${BANNER_MODE}`,
        }),
        transformResponse: response => response?.rows ?? [],
        providesTags: [TAG_PLATFORM_BANNERS],
      }),
    }),
  });

export const { useGetPlatformBannersQuery } = platformBannersApi;
