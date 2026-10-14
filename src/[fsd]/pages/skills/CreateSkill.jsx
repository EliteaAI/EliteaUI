import { memo, useMemo } from 'react';

import { Form, Formik } from 'formik';

import { Box, CircularProgress, Grid } from '@mui/material';

import { CreateSkillForm, CreateSkillTabBar, SkillValidateSchema } from '@/[fsd]/features/skill';
import { withDefaultSkillModel } from '@/[fsd]/features/skill/lib/helpers';
import { useSkillModels } from '@/[fsd]/features/skill/lib/hooks';
import { Breadcrumbs } from '@/[fsd]/shared/ui';
import StyledTabs from '@/components/StyledTabs';
import { StyledGridContainer } from '@/pages/Common/Components';

const CreateSkill = memo(() => {
  const styles = createSkillStyles();

  const { defaultModel, isLoadingModels } = useSkillModels();
  const initialValues = useMemo(
    () => ({
      name: '',
      description: '',
      version_details: {
        tags: [],
        instructions: '',
        run_settings: withDefaultSkillModel(null, defaultModel),
      },
    }),
    [defaultModel],
  );

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={SkillValidateSchema}
      onSubmit={() => {}}
    >
      <StyledTabs
        fullWidth
        tabSX={styles.tab}
        leftPart={<Breadcrumbs />}
        tabs={[
          {
            tabBarItems: <CreateSkillTabBar />,
            rightToolbar: <Box />,
            content: (
              <Box
                component={Form}
                sx={styles.form}
              >
                <StyledGridContainer
                  columnSpacing={'2rem'}
                  container
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={styles.gridItem}
                  >
                    {isLoadingModels ? (
                      <Box sx={styles.loadingContainer}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <CreateSkillForm
                        sx={styles.formContainer}
                        showGenerateButton
                      />
                    )}
                  </Grid>
                </StyledGridContainer>
              </Box>
            ),
          },
        ]}
      />
    </Formik>
  );
});

CreateSkill.displayName = 'CreateSkill';

/** @type {MuiSx} */
const createSkillStyles = () => ({
  form: {
    height: '100%',
  },
  tab: { paddingX: '1.5rem' },
  loadingContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    margin: '0.75rem auto 0',
    maxWidth: '40.1875rem',
  },
  gridItem: theme => ({
    [theme.breakpoints.up('lg')]: {
      overflowY: 'scroll',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      height: '100%',
      '::-webkit-scrollbar': {
        display: 'none',
      },
    },
    [theme.breakpoints.down('lg')]: {
      marginBottom: '1.5rem',
    },
  }),
});

export default CreateSkill;
