import { Box } from '@mui/material';

import styled from '@emotion/styled';

const HeaderContainer = styled(Box)(
  () => `
  display: flex;
  align-items: center;
  height: 100%;
  flex-direction: row-reverse;
  gap: 8px;
`,
);

export default HeaderContainer;
