import { useEffect } from 'react';

import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { Grid } from '@mui/material';

import CreateAgentForm from '@/[fsd]/features/agent/ui/agent-details/configurations/form/CreateAgentForm';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import StyledTabs from '@/components/StyledTabs';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import CreateApplicationTabBar from '@/pages/Applications/Components/Applications/CreateApplicationTabBar';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

export default function CreatePipeline() {
  const { initialValues } = useCreateApplicationInitialValues(true);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      actions.initThePipeline({
        nodes: [],
        edges: [],
        yamlJsonObject: {
          state: FlowEditorConstants.DefaultState,
        },
        yamlCode: '',
        layout_version: FlowEditorConstants.LAYOUT_VERSION,
      }),
    );
    dispatch(editorActions.resetPipelineEditor());
  }, [dispatch]);

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
            label: 'New Pipeline',
            tabBarItems: <CreateApplicationTabBar />,
            rightToolbar: <div />,
            content: (
              <Form style={{ height: '100%' }}>
                <Grid
                  columnSpacing={'32px'}
                  container
                  sx={theme => ({
                    padding: '12px 0px 12px 0px',
                    boxSizing: 'border-box',
                    height: '100%',
                    [theme.breakpoints.down('lg')]: {
                      overflowY: 'scroll',
                      height: 'calc(100vh - 70px)',
                      '::-webkit-scrollbar': {
                        display: 'none',
                      },
                    },
                  })}
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
                    <CreateAgentForm showInstructions={false} />
                  </Grid>
                </Grid>
              </Form>
            ),
          },
        ]}
      />
    </Formik>
  );
}
