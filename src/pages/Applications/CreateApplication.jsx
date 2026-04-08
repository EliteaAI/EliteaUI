import { Form, Formik } from 'formik';

import { Grid } from '@mui/material';

import StyledTabs from '@/components/StyledTabs';
import { StyledGridContainer } from '@/pages/Common/Components';

import ApplicationCreateForm from './Components/Applications/ApplicationCreateForm';
import getValidateSchema from './Components/Applications/ApplicationCreationValidateSchema';
import CreateApplicationTabBar from './Components/Applications/CreateApplicationTabBar';
import { useCreateApplicationInitialValues } from './useApplicationInitialValues';

export default function CreateApplication() {
  const { initialValues } = useCreateApplicationInitialValues();

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={getValidateSchema}
      onSubmit={() => {}}
    >
      <StyledTabs
        fullWidth
        tabSX={{ paddingX: '24px' }}
        tabs={[
          {
            label: 'New Agent',
            tabBarItems: <CreateApplicationTabBar />,
            rightToolbar: <div />,
            content: (
              <Form style={{ height: '100%' }}>
                <StyledGridContainer
                  columnSpacing={'32px'}
                  container
                >
                  <Grid
                    size={{ xs: 12 }}
                    sx={theme => ({
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
                    })}
                  >
                    <ApplicationCreateForm
                    // sx={{ display: editToolDetail ? 'none' : 'block' }}
                    />
                  </Grid>
                </StyledGridContainer>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
}
