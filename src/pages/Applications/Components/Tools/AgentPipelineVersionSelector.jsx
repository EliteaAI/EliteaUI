import React, { memo, useCallback, useMemo, useState } from 'react';

import { useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';

import StyledCircleProgress from '@/ComponentsLib/CircularProgress';
import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import {
  TAG_TYPE_APPLICATION_DETAILS,
  useApplicationDetailsQuery,
  useLazyGetApplicationVersionDetailQuery,
  useUpdateApplicationRelationMutation,
} from '@/api/applications';
import { eliteaApi } from '@/api/eliteaApi';
import RefreshIcon from '@/assets/refresh-icon.svg?react';
import { useSetRefetchDetails } from '@/hooks/application/useRefetchAgentDetails';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

/**
 * Checks if an error is due to a stale version reference (version was deleted/replaced)
 * This happens when a child agent version is deleted and replaced while the parent
 * agent page was still open with cached data.
 */
const isStaleVersionReferenceError = error => {
  const errorMessage = error?.data?.error || '';
  return errorMessage.includes('Already removed relation');
};

/**
 * Checks if an error is because the relation already exists
 * This happens when trying to create a relation that already exists in the backend
 * (e.g., when the backend already set the replacement version after deletion)
 */
const isRelationAlreadyExistsError = error => {
  const errorMessage = error?.data?.error || '';
  return errorMessage.includes('Already exists relation');
};

/**
 * Component for selecting agent/pipeline versions in the toolkit card according to Figma design
 */
const AgentPipelineVersionSelector = memo(({ tool, index, applicationId, disabled, entityProjectId }) => {
  const dispatch = useDispatch();
  const { values, setFieldValue, dirty, resetForm } = useFormikContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const selectedProjectId = useSelectedProjectId();
  const projectId = entityProjectId || selectedProjectId;
  const [updateApplicationRelation] = useUpdateApplicationRelationMutation();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toastSuccess, toastError, toastInfo } = useToast();
  const selectedVersionId = values?.version_details?.id;
  const { setRefetch } = useSetRefetchDetails();
  const [getVersionDetail] = useLazyGetApplicationVersionDetailQuery();
  const styles = agentPipelineVersionSelectorStyles();

  // Always use the private (project-scoped) endpoint to fetch versions.
  // This component is inside a Formik form so the user has project access.
  // The public endpoint filters out draft versions, which breaks sub-agent display
  // when sub-agents are added directly in the public project (their versions are draft).
  const { data: applicationData = { versions: [] }, refetch: refetchApplicationDetails } =
    useApplicationDetailsQuery(
      { projectId, applicationId: tool.settings?.application_id },
      { skip: !projectId || !tool.settings?.application_id },
    );

  // Get versions from the API response or fallback to local data, sorted properly
  const versions = useMemo(() => {
    return (
      applicationData?.versions
        ?.map(version => ({
          id: parseInt(version.id, 10), // Ensure ID is integer
          name: version.name || 'Unnamed version',
          created_at: version.created_at,
          status: version.status,
          isLatest: version.name === LATEST_VERSION_NAME,
        }))
        .filter(v => !isNaN(v.id) && v.id > 0) || []
    ).sort((a, b) => {
      // Latest version always comes first
      if (a.isLatest && !b.isLatest) return -1;
      if (!a.isLatest && b.isLatest) return 1;

      // If both are latest or both are not latest, sort by creation date (newest first)
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [applicationData]);

  // Check if the stored version reference is invalid (version was deleted)
  const isInvalidVersionReference = useMemo(() => {
    const storedVersionId = tool.settings?.application_version_id;
    return storedVersionId && versions.length > 0 && !versions.find(v => v.id === storedVersionId);
  }, [tool.settings?.application_version_id, versions]);

  // Get current selected version or default to latest
  const selectedVersion = useMemo(() => {
    const found = versions.find(v => v.id === tool.settings.application_version_id);
    if (found) return found;
    return versions[0] || null;
  }, [tool, versions]);

  // Helper function to format version display text
  const formatVersionDisplayText = useCallback(version => {
    if (version.isLatest) return LATEST_VERSION_NAME;

    const versionName = version.name || 'Unnamed version';

    // Format date as dd.MM.yyyy if available
    if (version.created_at) {
      try {
        const date = new Date(version.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}.${month}.${year}`;

        return `${versionName} – ${formattedDate}`;
      } catch {
        // If date parsing fails, just return the name
        return versionName;
      }
    }

    return versionName;
  }, []);

  // Get display text for the selected version
  const displayText = useMemo(() => {
    if (isInvalidVersionReference) return 'Invalid version';
    if (!selectedVersion) return LATEST_VERSION_NAME;
    return formatVersionDisplayText(selectedVersion);
  }, [selectedVersion, formatVersionDisplayText, isInvalidVersionReference]);

  // Helper function to invalidate cache and trigger refetch
  const invalidateCacheAndRefresh = useCallback(
    (childApplicationId = null) => {
      // Invalidate the application details cache to force a fresh fetch from server
      // This invalidates both the parent application and optionally the child application cache
      const tagsToInvalidate = [TAG_TYPE_APPLICATION_DETAILS];

      // If a child application ID is provided, also invalidate its specific cache
      // This ensures the child version list is refreshed (e.g., after version deletion)
      if (childApplicationId) {
        tagsToInvalidate.push({ type: TAG_TYPE_APPLICATION_DETAILS, id: childApplicationId });
      }

      dispatch(eliteaApi.util.invalidateTags(tagsToInvalidate));
      setRefetch();
    },
    [dispatch, setRefetch],
  );

  // Handle manual refresh of the version list
  // Directly refetch the application details to get fresh version data
  const handleRefresh = useCallback(
    async event => {
      event?.stopPropagation();
      setIsRefreshing(true);
      try {
        // Directly refetch application details to get fresh version list
        await refetchApplicationDetails();
        toastSuccess('Version list refreshed');
      } catch {
        toastError('Failed to refresh version list');
      } finally {
        // Small delay to ensure the UI reflects the loading state
        setTimeout(() => setIsRefreshing(false), 500);
      }
    },
    [refetchApplicationDetails, toastSuccess, toastError],
  );

  // Helper function to sync local state after successful version update
  const syncLocalStateAfterUpdate = useCallback(
    async (version, versionDetail) => {
      if (dirty) {
        // Save the version ID internally (as integer for API)
        await setFieldValue(`version_details.tools[${index}]`, {
          ...(values?.version_details?.tools[index] || {}),
          icon_meta: versionDetail?.icon_meta || null,
          settings: {
            application_id:
              values?.version_details?.tools[index]?.settings?.application_id || applicationData.id,
            application_version_id: version?.id,
          },
        });
      } else {
        resetForm({
          values: {
            ...values,
            version_details: {
              ...values.version_details,
              tools: values.version_details.tools.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      icon_meta: versionDetail?.icon_meta || null,
                      settings: {
                        application_id: item.settings.application_id || applicationData.id,
                        application_version_id: version?.id,
                      },
                    }
                  : item,
              ),
            },
          },
        });
        setRefetch();
      }
    },
    [dirty, setFieldValue, index, values, applicationData.id, resetForm, setRefetch],
  );

  // Handle version selection
  const handleVersionSelect = useCallback(
    async version => {
      setAnchorEl(null);
      setIsUpdating(true);
      try {
        // Call the API with two sequential calls: remove old, then add new
        if (tool.settings?.application_id && version?.id && projectId && applicationId && selectedVersionId) {
          let staleStateDetected = false;

          // Step 1: Remove existing association if there was a previous version
          if (tool.settings?.application_version_id && tool.settings.application_version_id !== version.id) {
            try {
              await updateApplicationRelation({
                projectId,
                selectedApplicationId: tool.settings.application_id, // Tool/subagent app ID
                selectedVersionId: tool.settings.application_version_id, // Tool/subagent version ID
                application_id: applicationId, // Main application ID
                version_id: selectedVersionId, // Main application version ID
                has_relation: false,
              }).unwrap();
            } catch (error) {
              // Check if error is due to stale version reference (version was deleted/replaced)
              // This happens when a child agent version is deleted in another tab and the relation
              // was already updated by the backend to point to a replacement version
              if (isStaleVersionReferenceError(error)) {
                // The relation was already removed/updated by the deletion process.
                // Mark that we detected stale state - we'll continue to step 2 to try
                // creating the new relation, which will tell us if it already exists.
                staleStateDetected = true;
              } else {
                // For other errors, show the error and stop
                toastError(error?.data?.error || 'Failed to remove old association');
                setIsUpdating(false);
                return;
              }
            }
          }

          // Step 2: Create new association
          try {
            await updateApplicationRelation({
              projectId,
              selectedApplicationId: tool.settings.application_id, // Tool/subagent app ID
              selectedVersionId: version.id, // NEW tool/subagent version ID
              application_id: applicationId, // Main application ID
              version_id: selectedVersionId, // Main application version ID
              has_relation: true,
            }).unwrap();
          } catch (error) {
            // Check if error is because relation already exists
            // This happens when the backend already has this exact version set
            // (e.g., it was set as replacement during version deletion)
            if (isRelationAlreadyExistsError(error)) {
              // The relation already exists with this version - this is actually the desired state
              // Just sync the local UI to match the backend state
              const { data: versionDetail } = await getVersionDetail({
                projectId,
                applicationId: tool.settings.application_id,
                versionId: version.id,
              });
              await syncLocalStateAfterUpdate(version, versionDetail);
              toastInfo('Version is already set correctly. UI has been synchronized.');
              setIsUpdating(false);
              return;
            } else if (staleStateDetected) {
              // We detected stale state in step 1 and step 2 also failed
              // Need to fully refresh from server, including child application cache
              invalidateCacheAndRefresh(tool.settings.application_id);
              toastError(
                'The version reference was outdated. The page has been refreshed with the current state. Please try again.',
              );
              setIsUpdating(false);
              return;
            } else {
              // Other error - rethrow to be handled by outer catch
              throw error;
            }
          }

          // Success - fetch version details and update local state
          const { data: versionDetail } = await getVersionDetail({
            projectId,
            applicationId: tool.settings.application_id,
            versionId: version.id,
          });

          await syncLocalStateAfterUpdate(version, versionDetail);
          toastSuccess('Application version updated successfully');
        }
      } catch (error) {
        toastError(error?.data?.error || 'Failed to update application version');
      }
      setIsUpdating(false);
    },
    [
      tool.settings.application_id,
      tool.settings.application_version_id,
      projectId,
      applicationId,
      selectedVersionId,
      updateApplicationRelation,
      getVersionDetail,
      toastSuccess,
      toastError,
      toastInfo,
      syncLocalStateAfterUpdate,
      invalidateCacheAndRefresh,
    ],
  );

  // Handle version selection for a specific version
  const handleVersionClick = useCallback(
    version => () => {
      handleVersionSelect(version);
    },
    [handleVersionSelect],
  );

  // Handle dropdown open
  const handleClick = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  // Handle dropdown close
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const versionSelectorContent = (
    <Box sx={styles.contentWrapper}>
      {/* Version Selector Button */}
      <Box
        sx={[styles.selector, disabled && { cursor: 'default', '&:hover': {} }]}
        onClick={isUpdating || disabled ? undefined : handleClick}
      >
        {isInvalidVersionReference && <WarningAmberIcon sx={styles.warningIcon} />}
        <Typography
          variant="bodySmall"
          className="version-text"
          sx={isInvalidVersionReference ? styles.versionTextInvalid : styles.versionText}
        >
          {displayText}
        </Typography>
        {isUpdating && <StyledCircleProgress size={16} />}
        {!disabled && (
          <KeyboardArrowDownIcon
            className="dropdown-icon"
            sx={[
              isInvalidVersionReference ? styles.dropdownIconInvalid : styles.dropdownIcon,
              { transform: anchorEl ? 'rotate(180deg)' : 'rotate(0deg)' },
            ]}
          />
        )}
      </Box>

      {/* Version Selection Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={styles.menu}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: styles.menuPaperOffset,
          },
        }}
      >
        {/* Version Header with Refresh Button */}
        <Box sx={styles.versionHeader}>
          <Typography
            variant="labelSmall"
            sx={styles.versionHeaderTitle}
          >
            Versions
          </Typography>
          <Tooltip
            title="Refresh versions"
            placement="top"
          >
            <IconButton
              variant="elitea"
              color="tertiary"
              size="small"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? <StyledCircleProgress size={12} /> : <RefreshIcon sx={styles.refreshIcon} />}
            </IconButton>
          </Tooltip>
        </Box>

        {versions.length === 0 && (
          <MenuItem
            disabled
            sx={styles.menuItem}
          >
            No versions available
          </MenuItem>
        )}

        {versions.map(version => {
          const isSelected = selectedVersion?.id === version.id;
          return (
            <MenuItem
              key={version.id}
              onClick={handleVersionClick(version)}
              sx={isSelected ? styles.selectedMenuItem : styles.menuItem}
            >
              <Typography variant="bodyMedium">{formatVersionDisplayText(version)}</Typography>
              {isSelected && <CheckIcon sx={styles.selectedCheckIcon} />}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );

  // Wrap with tooltip if version reference is invalid
  if (isInvalidVersionReference) {
    return (
      <Tooltip
        title="The selected version no longer exists. Please select a valid version or remove this agent/pipeline."
        placement="top"
        arrow
      >
        {versionSelectorContent}
      </Tooltip>
    );
  }

  return versionSelectorContent;
});

AgentPipelineVersionSelector.displayName = 'AgentPipelineVersionSelector';

/** @type {MuiSx} */
const agentPipelineVersionSelectorStyles = () => ({
  selector: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    padding: '0rem',
    height: 'auto',
    width: 'auto',
    minWidth: 'auto',
    maxWidth: 'none',
    background: 'none',
    border: 'none',
    boxSizing: 'border-box',
    position: 'relative',
    '&:hover': {
      '& .version-text': {
        color: palette.text.createButton,
      },
      '& .dropdown-icon': {
        color: palette.text.createButton,
      },
    },
  }),
  menu: ({ palette }) => ({
    '& .MuiPaper-root': {
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${palette.border.lines}`,
      background: palette.background.secondary,
      boxShadow: '0 0.5rem 0.75rem rgba(0, 0, 0, 0.3)',
      minWidth: '15rem',
      maxWidth: '17.5rem',
      maxHeight: '12.5rem',
      overflow: 'hidden',
    },
    '& .MuiList-root': {
      padding: '0 0 0.25rem',
      maxHeight: '11.5rem',
      overflowY: 'auto',
    },
  }),
  menuItem: ({ palette }) => ({
    fontFamily: 'Montserrat',
    padding: '0.5rem 1.25rem',
    minHeight: '2.5rem !important',
    color: palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: palette.background.button.iconLabelButton.hover,
    },
  }),
  selectedMenuItem: ({ palette }) => ({
    fontFamily: 'Montserrat',
    fontWeight: '500',
    padding: '0.5rem 1.25rem',
    minHeight: '2.5rem !important',
    color: palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.background.conversation?.selected,
    cursor: 'default',
    '&:hover': {
      backgroundColor: palette.background.conversation?.selected,
    },
  }),
  versionHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.25rem 0.75rem 0.25rem 1.25rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    minHeight: '1.75rem',
    marginBottom: '0.25rem',
  }),
  contentWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'auto',
    mt: 0,
    position: 'relative',
  },
  warningIcon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.warning.main,
    mr: '0.25rem',
    flexShrink: 0,
  }),
  versionText: ({ palette }) => ({
    color: palette.text.primary,
    fontFamily: 'Montserrat',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '7.5rem',
    flexShrink: 1,
  }),
  versionTextInvalid: ({ palette }) => ({
    color: palette.warning.main,
    fontFamily: 'Montserrat',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '7.5rem',
    flexShrink: 1,
  }),
  dropdownIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.primary,
    transition: 'transform 0.2s ease-in-out',
    flexShrink: 0,
  }),
  dropdownIconInvalid: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.warning.main,
    transition: 'transform 0.2s ease-in-out',
    flexShrink: 0,
  }),
  menuPaperOffset: {
    marginLeft: '-4rem',
    marginTop: '0.5rem',
  },
  versionHeaderTitle: ({ palette }) => ({
    fontFamily: 'Montserrat',
    color: palette.text.default,
    textTransform: 'uppercase',
  }),
  refreshIcon: {
    fontSize: '0.75rem',
    width: '0.75rem',
    height: '0.75rem',
  },
  selectedCheckIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.secondary,
    ml: 1,
  }),
});

export default AgentPipelineVersionSelector;
