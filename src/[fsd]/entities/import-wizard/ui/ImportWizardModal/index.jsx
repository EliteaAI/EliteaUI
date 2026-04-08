import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useSelector } from 'react-redux';

import { useForkProjectIds } from '@/[fsd]/entities/import-wizard/lib/hooks';
import IWModalActions from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalActions';
import IWModalContent from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalContent';
import IWModalFormikWrapper from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalFormikWrapper';
import IWModaSucceedlContent from '@/[fsd]/entities/import-wizard/ui/ImportWizardModal/IWModalSucceedContent';
import { Modal } from '@/[fsd]/shared/ui';
import { useLazyCheckPermissionListQuery } from '@/api';
import { ContentType, ViewMode } from '@/common/constants';
import useCardNavigate from '@/hooks/useCardNavigate';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const ImportWizardModalContainer = memo(props => (
  <IWModalFormikWrapper {...props}>
    <ImportWizardModal {...props} />
  </IWModalFormikWrapper>
));

ImportWizardModalContainer.displayName = 'ImportWizardModalContainer';

const ImportWizardModal = memo(props => {
  const { open, onClose, isForking } = props;

  const { excludedProjectIds } = useForkProjectIds(isForking);
  const selectedProjectId = useSelectedProjectId();

  const { values } = useFormikContext();

  const [getUserPermissions] = useLazyCheckPermissionListQuery();
  const user = useSelector(state => state.user);

  const [canImport, setCanImport] = useState(false);
  const [importSucceedData, setImportSucceedData] = useState(null);
  const [importErrorData, setImportErrorData] = useState(null);
  const [forkedData, setForkedData] = useState(null);

  const modalTitle = useMemo(() => {
    if (importSucceedData || forkedData) return `${isForking ? 'Fork' : 'Import'} Complete`;

    return `${isForking ? 'Fork' : 'Import'} parameters`;
  }, [importSucceedData, forkedData, isForking]);

  useEffect(() => {
    const checkImportPermission = permissions => {
      if (!permissions || permissions.length === 0) {
        return false;
      }
      const requiredPermissions = ['models.applications.export_import.import'];
      return requiredPermissions.every(permission => permissions.includes(permission));
    };

    const asyncCheckImportPermissionTask = async () => {
      const result = await getUserPermissions(values.selectedProject?.id);

      setCanImport(checkImportPermission(result.data));
    };

    setCanImport(false);

    if (!isForking && values.selectedProject?.id) {
      if (values.selectedProject?.id !== selectedProjectId) asyncCheckImportPermissionTask();
      else setCanImport(checkImportPermission(user.permissions));
    }
  }, [getUserPermissions, isForking, selectedProjectId, user.permissions, values.selectedProject?.id]);

  const onCloseHandler = useCallback(
    event => {
      onClose?.(event);
    },
    [onClose],
  );

  const { navigationItemData, navigationType } = useMemo(() => {
    const mainItem = values?.importItems?.[0];
    const mainEntityFullData = (importSucceedData || forkedData)?.[mainItem?.entity]?.find(
      item => item.name === mainItem.name && item.description === mainItem.description,
    );

    return {
      navigationItemData: mainEntityFullData,
      navigationType:
        mainEntityFullData?.version_details?.agent_type === 'pipeline'
          ? ContentType.PipelineAll
          : ContentType.ApplicationAll,
    };
  }, [forkedData, importSucceedData, values?.importItems]);

  const doNavigate = useCardNavigate({
    viewMode: ViewMode.Owner,
    id: navigationItemData?.id,
    projectId: values.selectedProject?.id,
    type: navigationType,
    name: navigationItemData?.name,
    replace: true,
    customTab: 'all',
  });

  const onSucceedImportAgree = useCallback(() => {
    onCloseHandler();
    doNavigate();
  }, [doNavigate, onCloseHandler]);

  return (
    <Modal.BaseModal
      open={open}
      title={modalTitle}
      onClose={onCloseHandler}
      dialogSx={{ padding: '.5rem 1.5rem !important', maxHeight: 'unset' }}
      content={
        importSucceedData || forkedData ? (
          <IWModaSucceedlContent
            data={(importSucceedData || forkedData)?.agents ?? []}
            importErrorData={importErrorData}
            isForking={isForking}
          />
        ) : (
          <IWModalContent
            isForking={isForking}
            excludedProjectIds={excludedProjectIds}
          />
        )
      }
      actions={
        <IWModalActions
          importSucceedData={importSucceedData}
          forkedData={forkedData}
          onCloseHandler={onCloseHandler}
          isForking={isForking}
          setImportSucceedData={setImportSucceedData}
          setImportErrorData={setImportErrorData}
          setForkedData={setForkedData}
          values={values}
          canImport={canImport}
          onSucceedImportAgree={onSucceedImportAgree}
        />
      }
    />
  );
});

ImportWizardModal.displayName = 'ImportWizardModal';

export default ImportWizardModalContainer;
