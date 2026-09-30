import { eliteaApi } from '@/api/eliteaApi';

const apiSlicePath = '/elitea_core/inject';

export const injectMessageApi = eliteaApi.injectEndpoints({
  endpoints: build => ({
    // Appends text to the running turn's user message group and forwards it to
    // the live agent loop. Deliberately not tagged: the socket events reconcile
    // chat state, so invalidating here would refetch the whole conversation
    // mid-stream.
    injectMessage: build.mutation({
      query: ({ projectId, conversationUuid, userInput, injectionId }) => ({
        url: `${apiSlicePath}/prompt_lib/${projectId}/${conversationUuid}`,
        method: 'POST',
        body: { user_input: userInput, injection_id: injectionId },
      }),
    }),
  }),
});

export const { useInjectMessageMutation } = injectMessageApi;
