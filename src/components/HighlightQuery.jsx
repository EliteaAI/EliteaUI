import { useSelector } from 'react-redux';

import { Typography } from '@mui/material';

import { splitStringByKeyword } from '@/common/utils';
import styled from '@emotion/styled';

const HighlightText = styled('span')(
  ({ theme }) => `
background: ${theme.palette.background.text.highlight};
mix-blend-mode: ${theme.palette.mode === 'dark' ? 'lighten' : 'darken'};
color: ${theme.palette.text.secondary};
`,
);

export default function HighlightQuery({ text, color, variant }) {
  const { searchDone, query } = useSelector(state => state.search);
  return splitStringByKeyword(text, searchDone ? query : '').map((item, idx) => {
    if (item.highlight) {
      return <HighlightText key={idx}>{item.text}</HighlightText>;
    } else {
      return (
        <Typography
          key={idx}
          variant={variant}
          color={color}
        >
          {item.text}
        </Typography>
      );
    }
  });
}
