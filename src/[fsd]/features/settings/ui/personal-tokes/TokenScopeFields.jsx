import { memo, useCallback, useMemo } from 'react';

import { Box, FormControlLabel, Typography } from '@mui/material';

import * as TokenScopeHelpers from '@/[fsd]/features/settings/lib/helpers/tokenScope.helpers';
import { Button, Checkbox } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import { useProjectListQuery } from '@/api/project';

// "Restrict this token" (#7336): collapsed by default; expanded, the projects and the operations of the token
const TokenScopeFields = memo(props => {
  const { restricted, projects, operations, error, onToggle, onProjectsChange, onOperationsChange } = props;
  const { data: projectList = [] } = useProjectListQuery(undefined, { skip: !restricted });
  const styles = tokenScopeFieldsStyles();

  const projectOptions = useMemo(
    () => projectList.map(project => ({ label: project.name, value: project.id })),
    [projectList],
  );

  const handleProjects = useCallback(event => onProjectsChange(event.target.value || []), [onProjectsChange]);

  const handleOperation = useCallback(
    operation => event =>
      onOperationsChange(
        event.target.checked ? [...operations, operation] : operations.filter(item => item !== operation),
      ),
    [onOperationsChange, operations],
  );

  return (
    <Box sx={styles.root}>
      <Button.BaseBtn
        data-testid="create-personal-token-restrict-toggle"
        variant={BUTTON_VARIANTS.tertiary}
        onClick={onToggle}
        aria-expanded={restricted}
      >
        {restricted ? 'Do not restrict this token' : 'Restrict this token'}
      </Button.BaseBtn>
      {restricted && (
        <Box
          sx={styles.fields}
          data-testid="create-personal-token-scope"
        >
          <SingleSelect
            data-testid="create-personal-token-scope-projects"
            showBorder
            multiple
            label="Projects"
            value={projects}
            onChange={handleProjects}
            options={projectOptions}
            showOptionIcon={false}
          />
          <Box sx={styles.operations}>
            {TokenScopeHelpers.TOKEN_OPERATIONS.map(operation => (
              <FormControlLabel
                key={operation}
                label={TokenScopeHelpers.OPERATION_LABELS[operation]}
                control={
                  <Checkbox.BaseCheckbox
                    size="small"
                    checked={operations.includes(operation)}
                    onChange={handleOperation(operation)}
                    inputProps={{ 'data-testid': `create-personal-token-scope-${operation}` }}
                  />
                }
              />
            ))}
          </Box>
          <Typography
            variant="bodySmall"
            sx={error ? styles.error : styles.hint}
            data-testid="create-personal-token-scope-hint"
          >
            {error ||
              `A restricted token works only in these projects, for these operations, and expires within ${TokenScopeHelpers.SCOPED_TOKEN_MAX_TTL_DAYS} days.`}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

TokenScopeFields.displayName = 'TokenScopeFields';

/** @type {MuiSx} */
const tokenScopeFieldsStyles = () => ({
  root: {
    width: '30rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  fields: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  operations: {
    display: 'flex',
    flexDirection: 'column',
  },
  hint: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  error: ({ palette }) => ({
    color: palette.text.error,
  }),
});

export default TokenScopeFields;
