import { eliteaApi } from '@/api';

const TAG_TYPE_SHARED_LINKS = 'TAG_TYPE_SHARED_LINKS';

const apiSlicePath = '/elitea_core';
const headers = { 'Content-Type': 'application/json' };

export const sharedLinksApiSlice = eliteaApi
  .enhanceEndpoints({ addTagTypes: [TAG_TYPE_SHARED_LINKS] })
  .injectEndpoints({
    endpoints: build => ({
      listShareLinks: build.query({
        query: ({ projectId, conversationId }) => ({
          url: `${apiSlicePath}/shared_chat_links/prompt_lib/${projectId}/${conversationId}`,
        }),
        providesTags: (result, error, { conversationId }) => [
          { type: TAG_TYPE_SHARED_LINKS, id: conversationId },
        ],
      }),
      createShareLink: build.mutation({
        query: ({ projectId, conversationId, ...body }) => ({
          url: `${apiSlicePath}/shared_chat_links/prompt_lib/${projectId}/${conversationId}`,
          method: 'POST',
          headers,
          body,
        }),
        invalidatesTags: (result, error, { conversationId }) => [
          { type: TAG_TYPE_SHARED_LINKS, id: conversationId },
        ],
      }),
      revokeShareLink: build.mutation({
        // eslint-disable-next-line no-unused-vars
        query: ({ projectId, token, conversationId }) => ({
          url: `${apiSlicePath}/shared_chat_link/prompt_lib/${projectId}/${token}`,
          method: 'DELETE',
        }),
        invalidatesTags: (result, error, { conversationId }) => [
          { type: TAG_TYPE_SHARED_LINKS, id: conversationId },
        ],
      }),
      getSharedConversation: build.query({
        query: ({ token }) => ({
          url: `${apiSlicePath}/shared_chat_view/prompt_lib/${token}`,
        }),
      }),
      unlockSharedConversation: build.mutation({
        query: ({ token, password }) => ({
          url: `${apiSlicePath}/shared_chat_view_unlock/prompt_lib/${token}/unlock`,
          method: 'POST',
          headers,
          body: { password },
        }),
      }),
    }),
  });

export const {
  useListShareLinksQuery,
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
  useGetSharedConversationQuery,
  useUnlockSharedConversationMutation,
} = sharedLinksApiSlice;
