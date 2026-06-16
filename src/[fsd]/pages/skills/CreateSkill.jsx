import { memo, useMemo } from 'react';

import { Form, Formik } from 'formik';

import { Grid } from '@mui/material';

import { SkillValidateSchema } from '@/[fsd]/features/skill/lib/validation';
import CreateSkillTabBar from '@/[fsd]/features/skill/ui/CreateSkillTabBar';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import StyledTabs from '@/components/StyledTabs';
import { StyledGridContainer } from '@/pages/Common/Components';

const CreateSkill = memo(() => {
  const styles = createSkillStyles();

  const initialValues = useMemo(
    () => ({
      name: '',
      description: '',
      version_details: {
        tags: [],
        instructions: '',
      },
    }),
    [],
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
        tabs={[
          {
            label: 'New Skill',
            tabBarItems: <CreateSkillTabBar />,
            rightToolbar: <div />,
            content: (
              <Form style={{ height: '100%' }}>
                <StyledGridContainer
                  columnSpacing={'32px'}
                  container
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={styles.gridItem}
                  >
                    <CreateSkillForm />
                  </Grid>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
});

CreateSkill.displayName = 'CreateSkill';

const createSkillStyles = () => ({
  tab: { paddingX: '24px' },
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
      marginBottom: '24px',
    },
  }),
});

export default CreateSkill;
