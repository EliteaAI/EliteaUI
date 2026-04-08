import { eliteaApi } from './eliteaApi';

export const llmApi = eliteaApi.injectEndpoints({
  endpoints: builder => ({
    // Generate content using LLM (streaming mode with socket.io)
    generateContentStreaming: builder.mutation({
      query: ({ projectId, sid, ...payload }) => ({
        url: `/elitea_core/predict_llm/prompt_lib/${projectId}`,
        method: 'POST',
        body: {
          ...payload,
          sid, // Socket ID for streaming
          await_task_timeout: 0, // Non-blocking mode: return immediately, stream via socket
        },
      }),
    }),
    // Generate content using LLM (blocking mode, returns result in HTTP response)
    generateContentBlocking: builder.mutation({
      query: ({ projectId, await_task_timeout = 60, ...payload }) => ({
        url: `/elitea_core/predict_llm/prompt_lib/${projectId}`,
        method: 'POST',
        body: {
          ...payload,
          await_task_timeout,
        },
      }),
    }),
    // Stop an active LLM generation task
    stopLlmTask: builder.mutation({
      query: ({ projectId, task_id }) => ({
        url: `/elitea_core/task/prompt_lib/${projectId}/${task_id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useGenerateContentStreamingMutation,
  useGenerateContentBlockingMutation,
  useStopLlmTaskMutation,
} = llmApi;
