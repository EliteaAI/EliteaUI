// Text links use the app link colour (4.5:1 for small text in both themes), not the brand colour. The shared
// linkHover token falls under 4.5:1, so hover keeps the link colour and adds an underline
export const TEXT_LINK_SX = ({ palette }) => ({
  color: palette.text.link,
  '&:hover': { color: palette.text.link, textDecoration: 'underline' },
});
