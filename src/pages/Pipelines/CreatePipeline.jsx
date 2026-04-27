import { useEffect } from 'react';

import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import StyledTabs from '@/components/StyledTabs';
import getValidateSchema from '@/pages/Applications/Components/Applications/ApplicationCreationValidateSchema';
import CreateApplicationTabBar from '@/pages/Applications/Components/Applications/CreateApplicationTabBar';
import { useCreateApplicationInitialValues } from '@/pages/Applications/useApplicationInitialValues';
import { actions } from '@/slices/pipeline';
import { actions as editorActions } from '@/slices/pipelineEditor';

import ConfigurationTab from './Components/ConfigurationTab';

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
              <ConfigurationTab
                totalToolCount={initialValues?.version_details?.tools.length || 0}
                isFetching={false}
                applicationId={''}
                setDirty={() => {}}
                setYamlDirty={() => {}}
              />
            ),
          },
        ]}
      />
    </Formik>
  );
}
