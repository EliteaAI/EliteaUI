import { useEffect, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

export default function useChatInteractionUUID(activeConversationId) {
  const [interaction_uuid, setInteractionUUID] = useState('');

  useEffect(() => {
    if (activeConversationId) {
      setInteractionUUID(uuidv4());
    }
  }, [activeConversationId]);

  return interaction_uuid;
}
