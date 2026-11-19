import { memo } from 'react';

const PinnedConversations = memo(props => {
  const { pinnedConversations, renderConversationItem } = props;

  return (
    <>
      {pinnedConversations.length > 0 && (
        <>{pinnedConversations.map(conversation => renderConversationItem(conversation))}</>
      )}
    </>
  );
});

PinnedConversations.displayName = 'PinnedConversations';

export default PinnedConversations;
