// BUG-38: text links use the app link colour (4.5:1 for small text in both themes), not the brand colour
export const TEXT_LINK_SX = ({ palette }) => ({
  color: palette.text.link,
  '&:hover': { color: palette.text.linkHover },
});
