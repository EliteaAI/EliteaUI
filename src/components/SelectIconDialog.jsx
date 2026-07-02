/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import StyledTooltip from '@/ComponentsLib/Tooltip';
import ProjectIconItem from '@/[fsd]/features/settings/ui/project-context/ProjectIconItem';
import UserIconItem from '@/[fsd]/features/settings/ui/project-context/UserIconItem';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import {
  useDeleteApplicationIconMutation,
  useGetApplicationDefaultIconsQuery,
  useGetApplicationIconsQuery,
  useReplaceApplicationIconMutation,
  useUploadApplicationIconMutation,
} from '@/api/applications';
import ImportIcon from '@/assets/import-icon.svg?react';
import { buildErrorMessage } from '@/common/utils';
import useToast from '@/hooks/useToast';

import { StyledCircleProgress } from './Chat/StyledComponents';
import EliteAImage from './EliteAImage';
import { EntityTypeIcon } from './EntityIcon';

export default function SelectIconDialog({
  open,
  onClose,
  entityType,
  selectedIcon,
  onSelectIcon,
  projectId,
  entityId,
  versionId,
}) {
  const systemSenderName = useSystemSenderName();
  const { toastError, toastSuccess } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(0);

  const { data: applicationDefaultIcons = [] } = useGetApplicationDefaultIconsQuery(
    { projectId },
    { skip: !projectId },
  );

  const {
    data: { rows: applicationIcons, total: totalApplicationIcons } = { rows: [], total: 0 },
    isFetching: isFetchingApplicationIcons,
  } = useGetApplicationIconsQuery(
    { projectId, page },
    { skip: !projectId || (entityType !== 'application' && entityType !== 'pipeline') },
  );

  const [uploadApplicationIcon] = useUploadApplicationIconMutation();
  const [replaceApplicationIcon] = useReplaceApplicationIconMutation();
  const [deleteApplicationIcon] = useDeleteApplicationIconMutation();

  const totalMap = useMemo(
    () => ({
      application: totalApplicationIcons,
      pipeline: totalApplicationIcons,
    }),
    [totalApplicationIcons],
  );

  const uploadFunctionMap = useMemo(
    () => ({
      application: uploadApplicationIcon,
      pipeline: uploadApplicationIcon,
    }),
    [uploadApplicationIcon],
  );

  const replaceFunctionMap = useMemo(
    () => ({
      application: replaceApplicationIcon,
      pipeline: replaceApplicationIcon,
    }),
    [replaceApplicationIcon],
  );

  const deleteFunctionMap = useMemo(
    () => ({
      application: deleteApplicationIcon,
      pipeline: deleteApplicationIcon,
    }),
    [deleteApplicationIcon],
  );

  const iconList = useMemo(
    () => (entityType === 'application' || entityType === 'pipeline' ? applicationIcons : []),
    [applicationIcons, entityType],
  );

  const uploadedIconList = useMemo(
    () => (entityType === 'application' || entityType === 'pipeline' ? applicationIcons : []),
    [applicationIcons, entityType],
  );

  const onImport = useCallback(() => {
    setIsUploading(true);
    fileInputRef.current && fileInputRef.current.click();
  }, []);

  const onClickIcon = useCallback(
    icon => async () => {
      if (!entityId) {
        onSelectIcon(icon);
        onClose();
      } else {
        const replaceFunction = replaceFunctionMap[entityType];
        const { error } = await replaceFunction({
          projectId,
          versionId,
          entityId,
          ...icon,
        });
        if (!error) {
          toastSuccess('The icon has been changed');
          onClose();
        } else {
          toastError(buildErrorMessage(error));
        }
      }
    },
    [
      entityId,
      entityType,
      onClose,
      onSelectIcon,
      projectId,
      replaceFunctionMap,
      toastError,
      toastSuccess,
      versionId,
    ],
  );

  const onSelectDefaultIcon = useCallback(async () => {
    if (!entityId) {
      onSelectIcon(null);
      onClose();
    } else {
      const replaceFunction = replaceFunctionMap[entityType];
      const { error } = await replaceFunction({
        projectId,
        versionId,
        entityId,
        name: '',
        url: '',
      });
      if (!error) {
        toastSuccess('The icon has been reset to default icon');
        onClose();
      } else {
        toastError(buildErrorMessage(error));
      }
    }
  }, [
    entityId,
    entityType,
    onClose,
    onSelectIcon,
    projectId,
    replaceFunctionMap,
    toastError,
    toastSuccess,
    versionId,
  ]);

  const onDeleteIcon = useCallback(
    name => async () => {
      const deleteFunction = deleteFunctionMap[entityType];
      const { error } = await deleteFunction({
        projectId,
        versionId,
        entityId,
        name,
      });
      if (!error) {
        toastSuccess('The icon has been deleted');
        if (selectedIcon?.name === name) {
          onSelectIcon({});
        }
      } else {
        toastError(buildErrorMessage(error));
      }
    },
    [
      deleteFunctionMap,
      entityId,
      entityType,
      onSelectIcon,
      projectId,
      selectedIcon?.name,
      toastError,
      toastSuccess,
      versionId,
    ],
  );

  const uploadFile = useCallback(
    async (event, uploadFunction, width, height) => {
      const { data: iconData, error } = await uploadFunction({
        projectId,
        versionId,
        entityId,
        files: event.target.files,
        width: width > 64 ? 64 : width,
        height: height > 64 ? 64 : height,
      });
      if (iconData && onSelectIcon) {
        toastSuccess('The image has been uploaded');
        if (!entityId) {
          onSelectIcon(iconData);
          onClose();
        } else {
          onClickIcon(iconData)();
        }
      } else {
        toastError(buildErrorMessage(error));
      }
      event.target.value = null;
      setIsUploading(false);
    },
    [entityId, onClickIcon, onClose, onSelectIcon, projectId, toastError, toastSuccess, versionId],
  );

  const handleFileChange = useCallback(
    async event => {
      const file = event.target.files[0];
      const uploadFunction = uploadFunctionMap[entityType];
      if (file && uploadFunction) {
        if (file.type === 'image/tiff') {
          await uploadFile(event, uploadFunction, 64, 64);
        } else {
          const reader = new FileReader();
          reader.onload = e => {
            const image = new Image();
            image.src = e.target.result;
            image.onload = async () => {
              await uploadFile(event, uploadFunction, image.width, image.height);
            };
          };
          reader.readAsDataURL(file);
        }
      } else {
        setIsUploading(false);
      }
    },
    [entityType, uploadFile, uploadFunctionMap],
  );

  const loadMoreFunc = useCallback(() => {
    const existsMore = totalMap[entityType] && uploadedIconList.length < totalMap[entityType];
    if (!existsMore) return;
    setPage(prev => prev + 1);
  }, [totalMap, entityType, uploadedIconList.length]);

  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (!fileInput) {
      return;
    }
    const onCancel = () => {
      setIsUploading(false);
    };

    fileInput.addEventListener('cancel', onCancel);
    return () => {
      fileInput.removeEventListener('cancel', onCancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileInputRef.current]);

  useEffect(() => {
    setIsUploading(false);
  }, []);

  const styles = selectIconDialogStyles();

  const headerActions = (
    <StyledTooltip
      title="Upload a bmp, ico, gif, jpeg, jpg, png, tiff or webp image (less than 500KB)"
      placement="top"
    >
      <IconButton
        variant="elitea"
        color="tertiary"
        onClick={isUploading ? undefined : onImport}
        disabled={isUploading}
      >
        {isUploading ? (
          <StyledCircleProgress size={16} />
        ) : (
          <Box
            component={ImportIcon}
            sx={styles.importIcon}
          />
        )}
      </IconButton>
    </StyledTooltip>
  );

  const modalContent = (
    <Box sx={styles.contentWrapper}>
      <Box>
        <Typography
          variant="labelSmall"
          color="text.tertiary"
          sx={styles.sectionLabel}
        >
          Default
        </Typography>
        <Box sx={styles.iconGrid}>
          <ProjectIconItem
            isSelected={!selectedIcon || !selectedIcon?.url}
            onClick={onSelectDefaultIcon}
          >
            <Box sx={styles.defaultIconContainer}>
              <EntityTypeIcon
                type={entityType}
                systemSenderName={systemSenderName}
              />
            </Box>
          </ProjectIconItem>
          {applicationDefaultIcons.map((icon, index) => (
            <ProjectIconItem
              isSelected={selectedIcon?.url === icon.url}
              key={'default' + index}
              onClick={onClickIcon(icon)}
            >
              <EliteAImage
                style={styles.iconImage}
                image={icon}
                alt="Preview"
              />
            </ProjectIconItem>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography
          variant="labelSmall"
          color="text.tertiary"
          sx={styles.sectionLabel}
        >
          Uploaded
        </Typography>
        <Box sx={styles.iconGrid}>
          {isFetchingApplicationIcons && (
            <Box sx={styles.loaderWrapper}>
              <StyledCircleProgress size={24} />
            </Box>
          )}
          {iconList.map((icon, index) => (
            <UserIconItem
              key={index}
              isSelected={selectedIcon?.url === icon.url}
              onClick={onClickIcon(icon)}
              onDelete={onDeleteIcon(icon.name)}
            >
              <EliteAImage
                style={styles.iconImage}
                image={icon}
                alt="Preview"
              />
            </UserIconItem>
          ))}
          {!isFetchingApplicationIcons && iconList.length === 0 && (
            <Typography
              variant="bodySmall"
              color="text.tertiary"
            >
              No uploaded icons yet
            </Typography>
          )}
        </Box>
        <ListInfiniteMoreLoader
          listCurrentSize={uploadedIconList?.length}
          totalAvailableCount={totalMap[entityType]}
          onLoadMore={loadMoreFunc}
          resetPageDependencies={undefined}
        />
      </Box>

      <Box
        component="input"
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.tiff,.webp,.gif,.bmp,.ico"
        sx={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </Box>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title="Choose the image from the list or upload"
      headerActions={headerActions}
      content={modalContent}
      sx={styles.modal}
    />
  );
}

/** @type {MuiSx} */
const selectIconDialogStyles = () => ({
  modal: {
    width: '50.625rem',
    maxWidth: '90vw',
    height: '32rem',
    maxHeight: 'calc(100vh - 10rem)',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sectionLabel: {
    marginBottom: '0.5rem',
  },
  iconGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  loaderWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: '1rem 0',
  },
  defaultIconContainer: ({ palette }) => ({
    minWidth: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    overflow: 'hidden',
    background: palette.background.icon?.default,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  iconImage: {
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  importIcon: ({ palette }) => ({
    fill: palette.icon.fill.default,
  }),
});
