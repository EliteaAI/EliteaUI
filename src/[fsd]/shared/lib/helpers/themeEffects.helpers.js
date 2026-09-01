export const createLinearGradient = ({
  start,
  end,
  direction = '180deg',
  startPosition = '0%',
  endPosition = '100%',
}) => `linear-gradient(${direction}, ${start} ${startPosition}, ${end} ${endPosition})`;

export const createGradientOrSolid = options =>
  options.start === options.end ? options.start : createLinearGradient(options);

export const createGradientOrNone = options => (options.direction ? createLinearGradient(options) : 'none');

export const createBoxShadow = ({ geometry, color, inset = false }) =>
  geometry ? `${geometry} ${color}${inset ? ' inset' : ''}` : 'none';

export const createResourceCard = ({ direction, start, end, colors, effects }) => ({
  card: createLinearGradient({ direction, start, end }),
  icon: createLinearGradient({
    direction: effects.iconDirection,
    start: colors.iconStart,
    end: colors.iconEnd,
    startPosition: effects.iconStartPosition,
    endPosition: effects.iconEndPosition,
  }),
  iconColor: colors.icon,
  iconBorderGradient: createLinearGradient({
    start: colors.iconBorderStart,
    end: colors.iconBorderEnd,
  }),
  divider: colors.divider,
  borderGradient: createLinearGradient({ start: colors.borderStart, end: colors.borderEnd }),
});
