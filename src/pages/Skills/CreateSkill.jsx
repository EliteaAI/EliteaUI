import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Form, Formik, useFormikContext } from 'formik';
import { useNavigate } from 'react-router-dom';

import { Grid, Button as MuiButton } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import CreateSkillForm from '@/[fsd]/features/skill/ui/skill-details/form/CreateSkillForm';
import { Button } from '@/[fsd]/shared/ui';
import { useSkillCreateMutation } from '@/api/skills';
import { SkillsTabs } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils.jsx';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import StyledTabs from '@/components/StyledTabs';
import useNavBlocker from '@/hooks/useNavBlocker';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast.jsx';
import { StyledGridContainer, TabBarItems } from '@/pages/Common/Components';
import SkillValidateSchema from '@/pages/Skills/SkillValidateSchema';
import RouteDefinitions from '@/routes';

const useCreateSkillInitialValues = () =>
  useMemo(
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

const CreateSkillTabBar = memo(() => {
  const formik = useFormikContext();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [createSkill, { isLoading, error, isError }] = useSkillCreateMutation();
  const [wantToCancel, setWantToCancel] = useState(false);

  const blockOptions = useMemo(
    () => ({ blockCondition: !!formik?.dirty && !wantToCancel }),
    [formik?.dirty, wantToCancel],
  );
  useNavBlocker(blockOptions);

  const shouldDisableSave = useMemo(
    () => isLoading || !formik.values.name?.trim() || !formik.values.description?.trim() || !formik.dirty,
    [formik.dirty, formik.values.description, formik.values.name, isLoading],
  );

  const onSave = useCallback(async () => {
    try {
      const result = await createSkill({
        projectId,
        name: formik.values.name?.trim() || '',
        description: formik.values.description?.trim() || '',
        versions: [
          {
            name: LATEST_VERSION_NAME,
            instructions: formik.values?.version_details?.instructions || '',
            tags: formik.values?.version_details?.tags || [],
          },
        ],
      }).unwrap();

      formik.resetForm({ values: formik.values });
      const skillId = result?.id;
      const pathname = `${RouteDefinitions.Skills}/${SkillsTabs[0]}/${skillId}`;
      setTimeout(() => {
        navigate(pathname, { replace: true });
      }, 0);
    } catch (e) {
      toastError(buildErrorMessage(e));
    }
  }, [createSkill, formik, navigate, projectId, toastError]);

  const onCancel = useCallback(() => {
    setWantToCancel(true);
  }, []);

  useEffect(() => {
    if (wantToCancel) {
      navigate(RouteDefinitions.Skills);
    }
  }, [navigate, wantToCancel]);

  useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <TabBarItems>
      <MuiButton
        variant="elitea"
        color="primary"
        disabled={shouldDisableSave}
        onClick={onSave}
      >
        Save
        {isLoading && <StyledCircleProgress size={20} />}
      </MuiButton>
      <Button.DiscardButton
        title="Cancel"
        disabled={isLoading}
        onDiscard={onCancel}
      />
    </TabBarItems>
  );
});

CreateSkillTabBar.displayName = 'CreateSkillTabBar';

const CreateSkill = memo(() => {
  const initialValues = useCreateSkillInitialValues();

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      validationSchema={SkillValidateSchema}
      onSubmit={() => {}}
    >
      <StyledTabs
        fullWidth
        tabSX={{ paddingX: '24px' }}
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

export default CreateSkill;
