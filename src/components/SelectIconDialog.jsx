/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Avatar, Box, Dialog, DialogContent, IconButton, Typography, styled } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import {
  useDeleteApplicationIconMutation,
  useGetApplicationDefaultIconsQuery,
  useGetApplicationIconsQuery,
  useReplaceApplicationIconMutation,
  useUploadApplicationIconMutation,
} from '@/api/applications';
import {
  useDeleteDatasourceIconMutation,
  useGetDatasourceIconsQuery,
  useReplaceDatasourceIconMutation,
  useUploadDatasourceIconMutation,
} from '@/api/datasources';
import ImportIcon from '@/assets/import-icon.svg?react';
import { buildErrorMessage, filterProps } from '@/common/utils';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import StyledTooltip from '../ComponentsLib/Tooltip';
import AlertDialog from './AlertDialog';
import AlitaImage from './AlitaImage';
import { StyledCircleProgress } from './Chat/StyledComponents';
import { EntityTypeIcon } from './EntityIcon';
import CloseIcon from './Icons/CloseIcon';

const StyledItemContainer = styled(
  Box,
  filterProps('isSelected', 'isHovering'),
)(({ theme, isSelected, isHovering }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '56px',
  width: '56px',
  borderRadius: '8px',
  border: isHovering
    ? `1px solid ${theme.palette.border.flowNode}`
    : `${isSelected ? 1 : 0}px solid ${theme.palette.primary.main}`,
  background: isSelected || isHovering ? theme.palette.background.icon.default : 'transparent',
  '&:hover': {
    border: `1px solid ${theme.palette.border.flowNode}`,
    background: theme.palette.background.icon.default,
  },
  cursor: 'pointer',
}));

const UserOwnIconContainer = ({ isSelected, children, onDelete, onClick }) => {
  const theme = useTheme();
  const [isHoveringOnIcon, setIsHoveringOnIcon] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const onCloseAlert = useCallback(() => {
    setOpenAlert(false);
  }, []);
  const onClickDelete = useCallback(event => {
    event.stopPropagation();
    setOpenAlert(true);
    setIsHoveringOnIcon(false);
  }, []);

  const onConfirmAlert = useCallback(async () => {
    setOpenAlert(false);
    onDelete();
  }, [onDelete]);

  const onMouseEnter = useCallback(() => {
    setIsHoveringOnIcon(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHoveringOnIcon(false);
  }, []);

  return (
    <>
      <Box
        onClick={onClick}
        position={'relative'}
        overflow={'visible'}
        sx={{
          '&:hover .deleteButton': {
            visibility: 'visible',
          },
        }}
      >
        <StyledItemContainer
          isSelected={isSelected}
          isHovering={isHoveringOnIcon}
        >
          {children}
        </StyledItemContainer>
        <IconButton
          className="deleteButton"
          variant="alita"
          color="delete"
          onClick={onClickDelete}
          sx={{
            visibility: 'hidden',
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <CloseIcon
            sx={{ cursor: 'pointer', fontSize: '16px' }}
            fill={theme.palette.icon.fill.delete}
          />
        </IconButton>
      </Box>
      <AlertDialog
        title={'Warning'}
        alertContent={`Are you sure to delete this icon?`}
        open={openAlert}
        alarm
        onClose={onCloseAlert}
        onCancel={onCloseAlert}
        onConfirm={onConfirmAlert}
      />
    </>
  );
};

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
  const theme = useTheme();
  const systemSenderName = useSystemSenderName();
  const { toastError, toastSuccess } = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(0);
  const {
    data: applicationDefaultIcons = [],
    isFetching: isFetchingApplicationDefaultIcons,
    error: fetchApplicationDefaultIconsError,
    isError: isFetchApplicationDefaultIconsError,
  } = useGetApplicationDefaultIconsQuery({ projectId }, { skip: !projectId });
  const {
    data: { rows: applicationIcons, total: totalApplicationIcons } = { rows: [], total: 0 },
    isFetching: isFetchingApplicationIcons,
    error: fetchApplicationIconsError,
    isError: isFetchApplicationIconsError,
  } = useGetApplicationIconsQuery(
    { projectId, page },
    { skip: !projectId || (entityType !== 'application' && entityType !== 'pipeline') },
  );
  const {
    data: { rows: datasourceIcons = [], total: totalDatasourceIcons } = { rows: [], total: 0 },
    isFetching: isFetchingDatasourceIcons,
    error: fetchDatasourceIconsError,
    isError: isFetchDatasourceIconsError,
  } = useGetDatasourceIconsQuery({ projectId, page }, { skip: !projectId || entityType !== 'datasource' });
  const [uploadApplicationIcon] = useUploadApplicationIconMutation();
  const [replaceApplicationIcon] = useReplaceApplicationIconMutation();
  const [deleteApplicationIcon] = useDeleteApplicationIconMutation();
  const [uploadDatasourceIcon] = useUploadDatasourceIconMutation();
  const [replaceDatasourceIcon] = useReplaceDatasourceIconMutation();
  const [deleteDatasourceIcon] = useDeleteDatasourceIconMutation();

  const totalMap = useMemo(
    () => ({
      application: totalApplicationIcons,
      pipeline: totalApplicationIcons,
      datasource: totalDatasourceIcons,
    }),
    [totalApplicationIcons, totalDatasourceIcons],
  );

  const uploadFunctionMap = useMemo(
    () => ({
      application: uploadApplicationIcon,
      pipeline: uploadApplicationIcon,
      datasource: uploadDatasourceIcon,
    }),
    [uploadApplicationIcon, uploadDatasourceIcon],
  );

  const replaceFunctionMap = useMemo(
    () => ({
      application: replaceApplicationIcon,
      pipeline: replaceApplicationIcon,
      datasource: replaceDatasourceIcon,
    }),
    [replaceApplicationIcon, replaceDatasourceIcon],
  );

  const deleteFunctionMap = useMemo(
    () => ({
      application: deleteApplicationIcon,
      pipeline: deleteApplicationIcon,
      datasource: deleteDatasourceIcon,
    }),
    [deleteApplicationIcon, deleteDatasourceIcon],
  );

  const iconList = useMemo(
    () =>
      entityType === 'application' || entityType === 'pipeline'
        ? applicationIcons
        : entityType === 'datasource'
          ? datasourceIcons
          : [],
    [applicationIcons, datasourceIcons, entityType],
  );

  const uploadedIconList = useMemo(
    () =>
      entityType === 'application' || entityType === 'pipeline'
        ? applicationIcons
        : entityType === 'datasource'
          ? datasourceIcons
          : [],
    [applicationIcons, datasourceIcons, entityType],
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
      const file = event.target.files[0]; // Get the selected file
      const uploadFunction = uploadFunctionMap[entityType];
      if (file && uploadFunction) {
        if (file.type === 'image/tiff') {
          await uploadFile(event, uploadFunction, 64, 64);
        } else {
          const reader = new FileReader();
          reader.onload = e => {
            const image = new Image(); // Create a new Image object
            image.src = e.target.result; // Set the image src to the file
            image.onload = async () => {
              // Once the image is loaded, get its dimensions
              await uploadFile(event, uploadFunction, image.width, image.height);
            };
          };
          reader.readAsDataURL(file); // Convert the file to a data URL
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

  const handleKeyDown = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        onKeyDown={handleKeyDown}
        hideBackdrop={false}
        PaperProps={{
          sx: {
            borderRadius: '8px',
            border: `1px solid ${theme.palette.border.lines}`,
            boxShadow: theme.palette.boxShadow.default,
            position: 'absolute',
            top: 0,
            margin: '200px',
            height: '514px',
            maxWidth: '90vw',
            width: '810px',
            maxHeight: 'calc(100vh - 250px)',
          },
        }}
      >
        <DialogContent
          sx={{
            maxWidth: '100%',
            width: '100%',
            padding: 0,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            height: '100%',
          }}
        >
          <Box
            display={'flex'}
            flexDirection={'column'}
            justifyContent={'flex-start'}
            alignItems={'flex-start'}
            width={'100%'}
            maxHeight={'100%'}
            borderRadius={'8px'}
            sx={{
              background: theme.palette.background.tabPanel,
            }}
          >
            <Box
              height={'60px'}
              padding="16px 32px"
              width={'100%'}
              borderBottom={`1px solid ${theme.palette.border.lines}`}
              display={'flex'}
              justifyContent={'space-between'}
            >
              <Typography
                variant="labelMedium"
                color={'text.secondary'}
              >
                Choose the image from the list or upload
              </Typography>
              <IconButton
                sx={{ marginLeft: '0px' }}
                variant="alita"
                color="tertiary"
                onClick={onClose}
              >
                <CloseIcon
                  fill={theme.palette.icon.fill.default}
                  sx={{ fontSize: '16px', cursor: 'pointer' }}
                />
              </IconButton>
            </Box>
            <Box
              className={''}
              height={'calc(100% - 60px)'}
              overflow={'hidden'}
              padding={'16px 24px'}
              boxSizing={'border-box'}
              width={'100%'}
              sx={{
                background: theme.palette.background.secondary,
              }}
            >
              <Box
                width={'100%'}
                height={'100%'}
                sx={{ overflowY: 'scroll' }}
                paddingTop={'8px'}
              >
                <Box
                  display={'flex'}
                  flexWrap={'wrap'}
                  gap={'8px'}
                  height={'auto'}
                  width={'100%'}
                >
                  <Box
                    display={'flex'}
                    height={'56px'}
                    width={'56px'}
                    justifyContent={'center'}
                    alignItems={'center'}
                  >
                    <StyledTooltip
                      placement="top"
                      title="Upload a bmp, ico, gif, jpeg, jpg, png, tiff or webp image (less than 500KB)"
                    >
                      <Box
                        minWidth="40px"
                        height={'40px'}
                        borderRadius={'50%'}
                        overflow={'hidden'}
                        sx={{
                          background: theme.palette.background.icon.default,
                          cursor: 'pointer',
                        }}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                        onClick={isUploading ? undefined : onImport}
                      >
                        <ImportIcon
                          style={{
                            fontSize: '1rem',
                            color: isUploading
                              ? theme.palette.icon.fill.disabled
                              : theme.palette.icon.fill.secondary,
                          }}
                        />
                        <input
                          ref={fileInputRef}
                          hidden
                          type="file"
                          onChange={handleFileChange}
                          accept=".jpg,.jpeg,.png,.tiff,.webp,.gif,.bmp,.ico"
                        />
                        {isUploading && <StyledCircleProgress size={20} />}
                      </Box>
                    </StyledTooltip>
                  </Box>
                  <StyledItemContainer
                    isSelected={!selectedIcon || !selectedIcon?.url}
                    onClick={onSelectDefaultIcon}
                  >
                    <Box
                      minWidth="40px"
                      height={'40px'}
                      borderRadius={'50%'}
                      overflow={'hidden'}
                      sx={{
                        background: theme.palette.background.icon.default,
                      }}
                      display={'flex'}
                      justifyContent={'center'}
                      alignItems={'center'}
                    >
                      <EntityTypeIcon
                        type={entityType}
                        systemSenderName={systemSenderName}
                      />
                    </Box>
                  </StyledItemContainer>
                  {iconList.map((icon, index) => (
                    <UserOwnIconContainer
                      isSelected={selectedIcon?.url === icon.url}
                      key={index}
                      onClick={onClickIcon(icon)}
                      onDelete={onDeleteIcon(icon.name)}
                    >
                      <Box
                        minWidth="40px"
                        height={'40px'}
                        borderRadius={'50%'}
                        overflow={'hidden'}
                      >
                        <AlitaImage
                          style={{ width: 40, height: 40 }}
                          image={icon}
                          alt="Preview"
                        />
                      </Box>
                    </UserOwnIconContainer>
                  ))}
                  {applicationDefaultIcons.map((icon, index) => (
                    <StyledItemContainer
                      isSelected={selectedIcon?.url === icon.url}
                      key={'default' + index}
                      onClick={onClickIcon(icon)}
                    >
                      <Box
                        minWidth="40px"
                        height={'40px'}
                        borderRadius={'50%'}
                        overflow={'hidden'}
                      >
                        <AlitaImage
                          style={{ width: 40, height: 40 }}
                          image={icon}
                          alt="Preview"
                        />
                      </Box>
                    </StyledItemContainer>
                  ))}
                </Box>
                <ListInfiniteMoreLoader
                  listCurrentSize={uploadedIconList?.length}
                  totalAvailableCount={totalMap[entityType]}
                  onLoadMore={loadMoreFunc}
                  resetPageDependencies={undefined}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
