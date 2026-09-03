export const itemToSpeakableText = item => {
  if (item.item_type === 'canvas_message') {
    return item.item_details.latest_version?.canvas_content || '';
  }
  if (item.item_type === 'attachment_message') {
    return '';
  }
  return item.item_details.content;
};
