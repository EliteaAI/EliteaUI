import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import {
  useDeleteProjectIconMutation,
  useGetProjectIconsQuery,
  useUpdateProjectIconMutation,
  useUploadProjectIconMutation,
} from '@/[fsd]/features/settings/api/projectInfoApi';
import BaseModal from '@/[fsd]/shared/ui/modal/BaseModal';
import ProjectAvatar from '@/[fsd]/widgets/sidebar-root/ui/ProjectAvatar';
import { useGetApplicationDefaultIconsQuery } from '@/api/applications';
import ImportIcon from '@/assets/import-icon.svg?react';
import { buildErrorMessage } from '@/common/utils';
import { StyledCircleProgress } from '@/components/Chat/StyledComponents';
import EliteAImage from '@/components/EliteAImage';
import useToast from '@/hooks/useToast';

import ProjectIconItem from './ProjectIconItem';
import UserIconItem from './UserIconItem';

const SelectProjectIconDialog = memo(props => {
  const { open, onClose, projectId, selectedIcon, projectName } = props;

  const fileInputRef = useRef(null);

  const styles = selectProjectIconDialogStyles();

  const { toastError, toastSuccess } = useToast();

  const [isUploading, setIsUploading] = useState(false);

  const { data: defaultIcons = [] } = useGetApplicationDefaultIconsQuery({ projectId }, { skip: !projectId });

  const { data: projectIconsData = { rows: [], total: 0 }, isFetching: isFetchingProjectIcons } =
    useGetProjectIconsQuery({ projectId }, { skip: !projectId });

  const [uploadProjectIcon] = useUploadProjectIconMutation();
  const [updateProjectIcon] = useUpdateProjectIconMutation();
  const [deleteProjectIcon] = useDeleteProjectIconMutation();

  const projectIcons = projectIconsData?.rows || [];

  const onImport = useCallback(() => {
    setIsUploading(true);
    fileInputRef.current?.click();
  }, []);

  const onSelectDefaultIcon = useCallback(async () => {
    const { error } = await updateProjectIcon({ projectId, icon_meta: null });
    if (!error) {
      toastSuccess('Project icon reset to default');
      onClose();
    } else {
      toastError(buildErrorMessage(error));
    }
  }, [projectId, updateProjectIcon, onClose, toastSuccess, toastError]);

  const onClickIcon = useCallback(
    async icon => {
      const { error } = await updateProjectIcon({ projectId, icon_meta: icon });

      if (!error) {
        toastSuccess('Project icon has been changed');
        onClose();
      } else {
        toastError(buildErrorMessage(error));
      }
    },
    [projectId, updateProjectIcon, onClose, toastSuccess, toastError],
  );

  const onDeleteIcon = useCallback(
    async name => {
      const { error } = await deleteProjectIcon({ projectId, name });

      if (!error) {
        toastSuccess('The icon has been deleted');

        if (selectedIcon?.name === name) await updateProjectIcon({ projectId, icon_meta: null });
      } else {
        toastError(buildErrorMessage(error));
      }
    },
    [projectId, deleteProjectIcon, updateProjectIcon, selectedIcon, toastSuccess, toastError],
  );

  const uploadFile = useCallback(
    async (event, width, height) => {
      const { data: iconData, error } = await uploadProjectIcon({
        projectId,
        files: event.target.files,
        width: width > 64 ? 64 : width,
        height: height > 64 ? 64 : height,
      });

      if (iconData) {
        toastSuccess('The image has been uploaded');

        await updateProjectIcon({ projectId, icon_meta: iconData });
        onClose();
      } else {
        toastError(buildErrorMessage(error));
      }

      event.target.value = null;
      setIsUploading(false);
    },
    [projectId, uploadProjectIcon, updateProjectIcon, onClose, toastSuccess, toastError],
  );

  const handleFileChange = useCallback(
    async event => {
      const file = event.target.files[0];

      if (!file) {
        setIsUploading(false);
        return;
      }

      if (file.type === 'image/tiff') {
        await uploadFile(event, 64, 64);
      } else {
        const reader = new FileReader();
        reader.onload = e => {
          const image = new Image();

          image.src = e.target.result;

          image.onload = async () => {
            await uploadFile(event, image.width, image.height);
          };
        };
        reader.readAsDataURL(file);
      }
    },
    [uploadFile],
  );

  useEffect(() => {
    const fileInput = fileInputRef.current;

    if (!fileInput) return;

    const onCancel = () => setIsUploading(false);

    fileInput.addEventListener('cancel', onCancel);

    return () => fileInput.removeEventListener('cancel', onCancel);
  }, []);

  const headerActions = (
    <StyledTooltip
      title="Upload a bmp, ico, gif, jpeg, jpg, png, tiff or webp image (less than 500KB)"
      placement="top"
    >
      <IconButton
        variant="elitea"
        color="tertiary"
        onClick={onImport}
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
      {/* Default icons */}
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
            isSelected={!selectedIcon?.url}
            onClick={onSelectDefaultIcon}
          >
            <ProjectAvatar
              projectName={projectName}
              size="2.25rem"
            />
          </ProjectIconItem>
          {defaultIcons.map(icon => (
            <ProjectIconItem
              key={icon.name}
              isSelected={selectedIcon?.name === icon.name}
              onClick={() => onClickIcon(icon)}
            >
              <EliteAImage
                image={icon}
                style={styles.iconImage}
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
          {isFetchingProjectIcons && (
            <Box sx={styles.loaderWrapper}>
              <StyledCircleProgress size={24} />
            </Box>
          )}
          {projectIcons.map(icon => (
            <UserIconItem
              key={icon.name}
              isSelected={selectedIcon?.name === icon.name}
              onClick={() => onClickIcon(icon)}
              onDelete={() => onDeleteIcon(icon.name)}
            >
              <EliteAImage
                image={icon}
                style={styles.iconImage}
              />
            </UserIconItem>
          ))}
          {!isFetchingProjectIcons && projectIcons.length === 0 && (
            <Typography
              variant="bodySmall"
              color="text.tertiary"
            >
              No uploaded icons yet
            </Typography>
          )}
        </Box>
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
});

SelectProjectIconDialog.displayName = 'SelectProjectIconDialog';

/** @type {MuiSx} */
const selectProjectIconDialogStyles = () => ({
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

export default SelectProjectIconDialog;
