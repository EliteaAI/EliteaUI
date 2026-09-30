/**
 * Native scrollbar styling for scrollable areas, matching the SimpleBar scrollbar that the chat and
 * every other `ScrollableContainer` area shows: a 0.5rem transparent track holding a fully rounded
 * 0.25rem thumb in the scrollbar palette colours.
 *
 * SimpleBar draws its thumb as a `::before` inset by 2px on every side of an 8px track, which a
 * native thumb reproduces with a transparent 0.125rem border clipped to the content box.
 *
 * The baseline hides every scrollbar in the app (`* { scrollbar-width: none }` in `MuiCssBaseline`),
 * so an element that should show one has to opt back in. `scrollbar-width: auto` restores it while
 * keeping Chromium on the `::-webkit-scrollbar` rules below — Chromium ignores those as soon as a
 * standard scrollbar property is set to anything else. Browsers without those pseudo-elements
 * (Firefox) get the standard properties instead.
 *
 * Spread into an `sx` array: `sx={[styles.list, customScrollbarSx]}`.
 */
export const customScrollbarSx = ({ palette }) => ({
  scrollbarWidth: 'auto',
  '&::-webkit-scrollbar': {
    width: '0.5rem',
    height: '0.5rem',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    borderRadius: '62.4375rem',
    backgroundColor: palette.scrollbar.thumb,
    border: '0.125rem solid transparent',
    backgroundClip: 'content-box',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    backgroundColor: palette.scrollbar.thumbHover,
  },
  '@supports not selector(::-webkit-scrollbar)': {
    scrollbarWidth: 'thin',
    scrollbarColor: `${palette.scrollbar.thumb} transparent`,
  },
});
