/**
 * Styled search input components
 *
 * Extracted from AddToCollectionDialog.jsx during collections removal (EL-2547).
 * TODO: Replace with generic project-level input component for better consistency.
 */
import { FormControl, Input } from '@mui/material';
import { styled } from '@mui/material/styles';

import { typographyVariants } from '@/MainTheme';

const getCommonStyle = theme => ({
  width: '100%',
  padding: '12px 20px',
  borderBottom: '1px solid ' + theme.palette.border.lines,
});

export const SearchInputContainer = styled(FormControl)(({ theme }) => ({
  ...getCommonStyle(theme),
}));

export const SearchInput = styled(Input)(() => ({
  ...typographyVariants.bodyMedium,
}));
