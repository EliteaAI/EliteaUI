// Switch for the chat's input field (imported by ChatBox and NewConversationView in Storybook, see .storybook/main.js):
// the team's NewChatInput, or the concept field when the story asks for it.
import { forwardRef, memo } from 'react';

import NewChatInput from '@/[fsd]/features/chat/ui/chat-input/NewChatInput';

import ConceptChatInput from '../ConceptChatInput';
import { useConceptSwap } from '../ConceptSwapContext';

const NewChatInputSwap = memo(
  forwardRef((props, ref) => {
    const { chatInput } = useConceptSwap();
    const Input = chatInput ? ConceptChatInput : NewChatInput;
    return (
      <Input
        {...props}
        ref={ref}
      />
    );
  }),
);

NewChatInputSwap.displayName = 'NewChatInputSwap';

export default NewChatInputSwap;
