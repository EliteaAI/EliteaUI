import { memo, useCallback, useEffect, useMemo } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box, Tooltip, Typography } from '@mui/material';

import { LATEST_VERSION_NAME } from '@/[fsd]/entities/version/lib/constants';
import { buildVersionOption } from '@/[fsd]/entities/version/lib/helpers';
import { SingleSelect } from '@/[fsd]/shared/ui/select';
import PublishIcon from '@/assets/publish-version.svg?react';
import { PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { replaceVersionInPath } from '@/common/utils';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import PinIcon from '@/components/Icons/PinIcon';
import { useNameFromUrl, useViewModeFromUrl } from '@/hooks/useSearchParamValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const VersionSelect = memo(props => {
  const {
    entityId,
    defaultVersionID,
    getVersionDetailQuery,
    onVersionChange,
    currentVersionName = '',
    versions = [],
    enableVersionListAvatar = false,
    disabled = false,
    useFormikVersions = false,
    formikVersionData = null,
    handleSetDefaultVersion = null,
    errorVersionName = '',
  } = props;

  const navigate = useNavigate();
  const { pathname, state, search } = useLocation();
  const urlParams = useParams();
  const entityName = useNameFromUrl();
  const viewMode = useViewModeFromUrl();
  const selectedProjectId = useSelectedProjectId();

  const styles = versionSelectStyles();

  const projectId = useMemo(
    () => (viewMode === ViewMode.Owner ? selectedProjectId : PUBLIC_PROJECT_ID),
    [selectedProjectId, viewMode],
  );

  // Determine entity and version IDs based on entity type
  const { entityIdFromParams, versionFromParams } = useMemo(
    () => ({
      entityIdFromParams: urlParams.agentId || urlParams.applicationId,
      versionFromParams: urlParams.version || urlParams.versionId,
    }),
    [urlParams],
  );

  const actualEntityId = entityId || entityIdFromParams;

  const actualVersions = useMemo(() => {
    if (useFormikVersions && formikVersionData) return formikVersionData.versions || [];

    return versions;
  }, [useFormikVersions, formikVersionData, versions]);

  const currentVersion = useMemo(() => {
    if (useFormikVersions && formikVersionData) {
      const versionIdFromDetail = formikVersionData.version_details?.id;
      const currentVersionId = versionFromParams || versionIdFromDetail;

      return actualVersions.find(item => item.id == currentVersionId)?.id;
    } else {
      return actualVersions.find(item => item.name === currentVersionName)?.id;
    }
  }, [useFormikVersions, formikVersionData, versionFromParams, actualVersions, currentVersionName]);

  const versionSelectOptions = useMemo(() => {
    // Sort versions: defaultVersionID at top, then by date (newest first), LATEST_VERSION_NAME at bottom
    const sortedVersions = [...actualVersions].sort((a, b) => {
      // Always put defaultVersionID at the top
      if (a.id === defaultVersionID) return -1;
      if (b.id === defaultVersionID) return 1;

      // Always put LATEST_VERSION_NAME at the bottom
      if (a.name === LATEST_VERSION_NAME) return 1;
      if (b.name === LATEST_VERSION_NAME) return -1;

      // Sort other versions by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return sortedVersions.map(
      buildVersionOption({ enableVersionListAvatar, defaultVersionID, handleSetDefaultVersion }),
    );
  }, [actualVersions, enableVersionListAvatar, defaultVersionID, handleSetDefaultVersion]);

  const onSelectVersion = useCallback(
    newVersion => {
      // Find the selected version object
      const selectedVersionObj = actualVersions.find(item => item.id === newVersion);

      const newPath = replaceVersionInPath(
        selectedVersionObj?.id,
        pathname,
        versionFromParams,
        actualEntityId,
      );

      const routeStack = [...(state?.routeStack || [])];

      if (routeStack.length) {
        routeStack[routeStack.length - 1] = {
          ...routeStack[routeStack.length - 1],
          pagePath: `${newPath}?${search}`,
        };
      } else {
        routeStack.push({
          pagePath: `${newPath}?${search}`,
          breadCrumb: entityName,
          viewMode,
        });
      }

      navigate(
        { pathname: newPath, search },
        {
          replace: true,
          state: {
            routeStack,
          },
        },
      );

      if (onVersionChange) onVersionChange(newVersion, selectedVersionObj);
    },
    [
      actualVersions,
      pathname,
      versionFromParams,
      actualEntityId,
      search,
      state?.routeStack,
      navigate,
      entityName,
      viewMode,
      onVersionChange,
    ],
  );

  // Handle version detail loading
  useEffect(() => {
    if (getVersionDetailQuery && versionFromParams) {
      const versionId = actualVersions.find(item => item.id == versionFromParams)?.id;

      if (versionId) {
        const queryParams = { projectId, applicationId: actualEntityId, versionId };
        getVersionDetailQuery(queryParams);
      }
    }
  }, [getVersionDetailQuery, projectId, actualEntityId, versionFromParams, actualVersions]);

  return (
    <Box sx={styles.verseionSelectWrapper}>
      {!!errorVersionName && (
        <Tooltip
          title={`Toolkit(s) configuration issue in ${errorVersionName}`}
          placement="bottom"
        >
          <Box sx={styles.attentionIconWrapper}>
            <AttentionIcon />
          </Box>
        </Tooltip>
      )}
      <Typography sx={styles.label}>VERSION:</Typography>
      <Box sx={styles.selectContainer}>
        <SingleSelect
          showOptionIcon
          iconPosition="right"
          disabled={disabled}
          onValueChange={onSelectVersion}
          customRenderValue={option => {
            const isPublished = actualVersions.find(v => v.id === option.value)?.status === 'published';

            return (
              <Box sx={styles.selectValueContainer}>
                {option.value === defaultVersionID && <PinIcon />}
                {isPublished && (
                  <Box
                    sx={({ palette }) => ({
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      svg: { path: { fill: palette.icon.fill.success } },
                    })}
                  >
                    <PublishIcon sx={{ fontSize: '1rem' }} />
                  </Box>
                )}
                <Typography sx={{ fontSize: '.875rem' }}>{option.label}</Typography>
              </Box>
            );
          }}
          value={currentVersion}
          options={versionSelectOptions}
          optionsWithAvatar={enableVersionListAvatar}
          inputSX={styles.inputSx}
          maxDisplayValueLength="12.5rem"
          menuItemIconSX={styles.menuItemIconSx}
          customMenuProps={{
            sx: styles.customMenuPropsSx,
          }}
        />
      </Box>
    </Box>
  );
});

VersionSelect.displayName = 'VersionSelect';

/** @type {MuiSx} */
const versionSelectStyles = () => ({
  verseionSelectWrapper: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    height: '100%',
    paddingTop: 0,
  },
  label: ({ palette }) => ({
    display: 'inline-block',
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    color: palette.text.deafult,
  }),
  selectContainer: {
    display: 'inline-block',
    boxSizing: 'border-box',
    marginRight: '1rem',
    paddingTop: '0.16rem',
  },
  selectValueContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    justifyContent: 'flex-start',

    svg: {
      fontSize: '1rem',

      path: {
        fill: palette.icon.fill.inactive,
      },
    },
  }),
  inputSx: {
    '& .MuiSelect-select': {
      paddingRight: '.5rem !important',
    },
  },
  menuItemIconSx: {
    width: '1rem',
    height: '1rem',
    svg: { fontSize: '1rem', path: { fill: ({ palette }) => palette.icon.fill.inactive } },
  },
  customMenuPropsSx: {
    '& .MuiPaper-root': {
      width: '15rem',
      maxWidth: '15rem',
      minWidth: '15rem',

      li: {
        '> div': {
          maxWidth: '90%',
        },
      },
    },
  },
  attentionIconWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    marginRight: '0.5rem',
    '& svg': {
      fontSize: '1rem',
      fill: palette.icon.fill.attention,
    },
  }),
});

export default VersionSelect;
