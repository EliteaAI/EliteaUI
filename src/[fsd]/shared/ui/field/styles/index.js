export const includeFieldWrapperOverlapStyles = disabled =>
  disabled
    ? {
        pointerEvents: 'none',

        ':after': {
          position: 'absolute',
          content: '""',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
        },
      }
    : {};
