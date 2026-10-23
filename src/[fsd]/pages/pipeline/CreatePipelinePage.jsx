import { memo, useEffect, useMemo } from 'react';

import { Form, Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { Box, CircularProgress } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { ParsePipelineHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { DEFAULT_PIPELINE_KEY } from '@/[fsd]/features/pipelines/lib/constants';
import { useDefaultPipelineName } from '@/[fsd]/features/pipelines/lib/hooks';
import { PipelineValidateSchema } from '@/[fsd]/features/pipelines/lib/validation';
import { Breadcrumbs } from '@/[fsd]/shared/ui';
import { PipelineCreateTabBar } from '@/[fsd]/widgets/pipeline-create-tab-bar';
import { PipelineEditorWorkspace } from '@/[fsd]/widgets/pipeline-editor';
import StyledTabs from '@/components/StyledTabs';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

const CreatePipelinePage = memo(() => {
  const dispatch = useDispatch();
  const { initialValues: baseInitialValues } = useCreateApplicationInitialValues(true);
  const { defaultName, isLoading: isLoadingName } = useDefaultPipelineName();

  const initialValues = useMemo(
    () => ({ ...baseInitialValues, name: defaultName }),
    [baseInitialValues, defaultName],
  );

  useEffect(() => {
    const yamlJsonObject = { state: FlowEditorConstants.DefaultState };
    // Seeds the End node; the canvas keeps it hidden until the first node is added
    const { nodes, edges } = ParsePipelineHelpers.parseYaml(
      yamlJsonObject,
      FlowEditorConstants.ORIENTATION.vertical,
    );

    dispatch(actions.setActivePipelineKey(DEFAULT_PIPELINE_KEY));
    dispatch(
      actions.initThePipeline({
        nodes,
        edges,
        yamlJsonObject,
        yamlCode: '',
        layout_version: FlowEditorConstants.LAYOUT_VERSION,
      }),
    );
    dispatch(editorActions.resetPipelineEditor());
  }, [dispatch]);

  const styles = createPipelinePageStyles();

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={PipelineValidateSchema}
      onSubmit={() => {}}
    >
      <Box
        component={Form}
        sx={styles.form}
      >
        <StyledTabs
          fullWidth
          panelStyle={styles.tabPanel}
          containerStyle={styles.tabContainer}
          leftTabbarSectionSX={styles.leftTabbarSection}
          leftPart={<Breadcrumbs />}
          tabs={[
            {
              tabBarItems: <PipelineCreateTabBar />,
              rightToolbar: <Box />,
              content: isLoadingName ? (
                <Box sx={styles.loadingContainer}>
                  <CircularProgress />
                </Box>
              ) : (
                <PipelineEditorWorkspace />
              ),
            },
          ]}
        />
      </Box>
    </Formik>
  );
});

CreatePipelinePage.displayName = 'CreatePipelinePage';

/** @type {MuiSx} */
const createPipelinePageStyles = () => ({
  form: {
    height: '100%',
  },
  tabPanel: {
    padding: '0rem !important',
  },
  tabContainer: {
    '& .MuiTabs-indicator': {
      display: 'none !important',
    },
  },
  leftTabbarSection: {
    maxWidth: '33%',
    width: 'fit-content',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
});

export default CreatePipelinePage;
