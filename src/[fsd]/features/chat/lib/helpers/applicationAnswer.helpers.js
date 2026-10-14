export const itemToSpeakableText = item => {
  if (item.item_type === 'canvas_message') {
    return item.item_details.latest_version?.canvas_content || '';
  }
  if (item.item_type === 'attachment_message') {
    return '';
  }
  return item.item_details.content;
};

export const ANSWERLESS_REPLY_TEXT = 'No response was returned.';

// A finished reply with nothing to show (no text, items, error or pending action),
// e.g. an agent run that ended without an answer. Without a placeholder the bubble
// is a bare header and its Regenerate/Delete actions are unreachable. Swarm parents
// are excluded: their children's answers render below in SwarmChildList.
export const isAnswerlessReply = ({ isProcessing, isEditing, shouldRenderAnswerBlock, hasSwarmChildren }) =>
  !isProcessing && !isEditing && !shouldRenderAnswerBlock && !hasSwarmChildren;
