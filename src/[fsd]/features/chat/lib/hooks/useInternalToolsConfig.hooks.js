import { useConversationEditMutation } from '@/api/chat';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useInternalToolsConfig = ({ activeConversation, setActiveConversation }) => {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();

  const [editConversation, { isLoading }] = useConversationEditMutation();

  const onInternalToolsConfigChange = async ({ key, value }) => {
    const internalTools = activeConversation?.meta?.internal_tools || [];

    const newTools = value ? [...internalTools, key] : [...internalTools].filter(tool => tool !== key);

    const newMeta = {
      ...(activeConversation?.meta || {}),
      internal_tools: newTools,
    };

    // change local state first for better UX
    setActiveConversation({
      ...activeConversation,
      meta: newMeta,
    });

    setTimeout(async () => {
      // send update to backend
      const result = await editConversation({
        projectId,
        id: activeConversation.id,
        meta: newMeta,
      });
      if (!result.error) {
        toastSuccess('Internal tools configuration updated');
      } else {
        // if update fails, revert local state
        setActiveConversation({
          ...activeConversation,
          meta: {
            ...(activeConversation.meta || {}),
            internal_tools: activeConversation.meta?.internal_tools,
          },
        });
        toastError(
          buildErrorMessage(result.error) || 'Failed to update internal tools config, please try again.',
        );
      }
    }, 0);
  };

  return {
    onInternalToolsConfigChange,
    isUpdatingInternalToolsConfig: isLoading,
  };
};
