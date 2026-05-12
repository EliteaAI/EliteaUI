import { memo } from 'react';

import { MuiMarkdown } from 'mui-markdown';

const DefaultMarkdown = memo(props => {
  const { markedToken, overrides } = props;
  try {
    return <MuiMarkdown overrides={overrides(markedToken.raw)}>{markedToken.raw}</MuiMarkdown>;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('render default markdown error: ', error);
    return (
      <MuiMarkdown
        options={{
          disableParsingRawHTML: true,
          overrides: overrides(markedToken.raw),
        }}
      >
        {markedToken.raw}
      </MuiMarkdown>
    );
  }
});

DefaultMarkdown.displayName = 'DefaultMarkdown';

export default DefaultMarkdown;
