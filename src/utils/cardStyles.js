/**
 * Returns the `::before` pseudo-element styles that create the gradient border overlay.
 * Uses the CSS mask-composite technique to produce a 1px gradient border on rounded cards.
 *
 * @param {import('@mui/material').Palette} palette
 */
export const getCardGradientBorderBefore = palette => ({
  content: '""',
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
  padding: '0.0625rem',
  background: palette.border.cardsOutlinesGradient,
  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
  pointerEvents: 'none',
});

/**
 * Returns the hover styles for gradient cards (background change, border highlight, shadow).
 *
 * @param {import('@mui/material').Palette} palette
 */
export const getCardGradientHover = palette => ({
  background: palette.background.card.hover,
  '&::before': {
    background: palette.background.card.hoverBorderGradient,
  },
  boxShadow: palette.background.card.hoverShadow,
});

/**
 * Returns the base MUI sx styles shared across gradient cards:
 * gradient background, border-radius, transparent border, ::before gradient border overlay,
 * and optional hover effects.
 *
 * Usage:
 * ```js
 * card: ({ palette }) => ({
 *   ...getCardGradientStyles(palette),
 *   height: '7rem',
 *   // ...card-specific styles
 * }),
 * ```
 *
 * To disable hover (e.g. for a disabled card):
 * ```js
 * cardContainer: ({ palette }) => ({
 *   ...getCardGradientStyles(palette, { enableHover: false }),
 * }),
 * ```
 *
 * @param {import('@mui/material').Palette} palette
 * @param {{ enableHover?: boolean }} [options]
 */
export const getCardGradientStyles = (palette, { enableHover = true } = {}) => ({
  position: 'relative',
  borderRadius: '0.75rem',
  border: 'none',
  background: palette.background.card.gradientDark,
  '&::before': getCardGradientBorderBefore(palette),
  '&:hover': enableHover && getCardGradientHover(palette),
});
