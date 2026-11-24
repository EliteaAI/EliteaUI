import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { CompareVersionHeader } from '@/[fsd]/entities/compare-versions';
import { useSkillVersionFileTextQuery, useSkillVersionFilesQuery } from '@/[fsd]/features/skill/api';
import {
  SKILL_COMPARE_FILE_STATUS,
  SKILL_FILES_READ_ONLY_STATUSES,
} from '@/[fsd]/features/skill/lib/constants';
import {
  buildCompareFileEntries,
  buildSkillFileTree,
  fileEditKey,
  isDiffableTextFile,
  listTreeFiles,
  summarizeCompareFiles,
  toFieldText,
  withStoredLineEndings,
} from '@/[fsd]/features/skill/lib/helpers';
import { useSkillFileActions } from '@/[fsd]/features/skill/lib/hooks/useSkillFileActions.hooks';
import { useSkillVersionFileTexts } from '@/[fsd]/features/skill/lib/hooks/useSkillVersionFileTexts.hooks';
import { Switch } from '@/[fsd]/shared/ui';

import SkillCompareFileSide from './SkillCompareFileSide';
import SkillCompareFileTree from './SkillCompareFileTree';

const ONLY_CHANGED_SLOT_PROPS = {
  container: { sx: { width: 'auto', height: 'auto' } },
  formControlLabel: { labelPlacement: 'start', sx: { margin: 0 } },
  label: { variant: 'bodySmall', color: 'text.primary' },
};

const SkillCompareFilesStep = memo(props => {
  const {
    projectId,
    skillId,
    leftVersion,
    rightVersion,
    leftData,
    rightData,
    leftEdits,
    rightEdits,
    onLeftEdit,
    onRightEdit,
    leftHeaderSave,
    rightHeaderSave,
    readOnly = false,
  } = props;
  const styles = skillCompareFilesStepStyles();

  const [onlyChanged, setOnlyChanged] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);

  const leftScope = useMemo(
    () => ({ projectId, skillId, versionId: leftVersion?.id }),
    [projectId, skillId, leftVersion?.id],
  );
  const rightScope = useMemo(
    () => ({ projectId, skillId, versionId: rightVersion?.id }),
    [projectId, skillId, rightVersion?.id],
  );

  const { data: leftFiles = leftData.files } = useSkillVersionFilesQuery(leftScope);
  const { data: rightFiles = rightData.files } = useSkillVersionFilesQuery(rightScope);

  const savedEntries = useMemo(() => buildCompareFileEntries(leftFiles, rightFiles), [leftFiles, rightFiles]);
  const isTouched = useCallback(
    path =>
      [leftEdits, rightEdits, leftData, rightData].some(values => values[fileEditKey(path)] !== undefined),
    [leftEdits, rightEdits, leftData, rightData],
  );
  const touchedPairPaths = useMemo(
    () =>
      savedEntries
        .filter(({ path, left, right }) => left && right && isTouched(path))
        .map(({ path }) => path),
    [savedEntries, isTouched],
  );
  const leftSavedTexts = useSkillVersionFileTexts(leftScope, touchedPairPaths);
  const rightSavedTexts = useSkillVersionFileTexts(rightScope, touchedPairPaths);

  const entries = useMemo(
    () =>
      savedEntries.map(entry => {
        const key = fileEditKey(entry.path);
        const leftRawText = leftEdits[key] ?? leftData[key] ?? leftSavedTexts[entry.path];
        const rightRawText = rightEdits[key] ?? rightData[key] ?? rightSavedTexts[entry.path];
        if (!touchedPairPaths.includes(entry.path) || leftRawText === undefined || rightRawText === undefined)
          return entry;
        const { changed, same } = SKILL_COMPARE_FILE_STATUS;
        return {
          ...entry,
          status: leftRawText === rightRawText ? same : changed,
        };
      }),
    [
      savedEntries,
      touchedPairPaths,
      leftEdits,
      rightEdits,
      leftData,
      rightData,
      leftSavedTexts,
      rightSavedTexts,
    ],
  );
  const summary = useMemo(() => summarizeCompareFiles(entries), [entries]);

  const visibleEntries = useMemo(
    () =>
      onlyChanged
        ? entries.filter(entry => entry.status !== SKILL_COMPARE_FILE_STATUS.same || isTouched(entry.path))
        : entries,
    [onlyChanged, entries, isTouched],
  );

  const root = useMemo(() => buildSkillFileTree(visibleEntries), [visibleEntries]);
  const activeEntry = useMemo(
    () => visibleEntries.find(entry => entry.path === selectedPath) ?? listTreeFiles(root)[0] ?? null,
    [visibleEntries, selectedPath, root],
  );

  const isTextCompare =
    Boolean(activeEntry) && [activeEntry.left, activeEntry.right].filter(Boolean).every(isDiffableTextFile);
  const editKey = activeEntry ? fileEditKey(activeEntry.path) : null;

  const leftText = useSkillVersionFileTextQuery(
    { ...leftScope, path: activeEntry?.path },
    {
      skip: !isTextCompare || !activeEntry.left,
      refetchOnMountOrArgChange: true,
    },
  );
  const rightText = useSkillVersionFileTextQuery(
    { ...rightScope, path: activeEntry?.path },
    {
      skip: !isTextCompare || !activeEntry.right,
      refetchOnMountOrArgChange: true,
    },
  );

  const leftStored = leftData[editKey] ?? leftText.currentData;
  const rightStored = rightData[editKey] ?? rightText.currentData;
  const leftRaw = leftEdits[editKey] ?? leftStored;
  const rightRaw = rightEdits[editKey] ?? rightStored;
  const leftValue = toFieldText(leftRaw);
  const rightValue = toFieldText(rightRaw);

  const { downloadPath: downloadLeft } = useSkillFileActions(leftScope);
  const { downloadPath: downloadRight } = useSkillFileActions(rightScope);

  const handleLeftChange = useCallback(
    text => onLeftEdit(editKey, withStoredLineEndings(text, leftStored)),
    [onLeftEdit, editKey, leftStored],
  );
  const handleRightChange = useCallback(
    text => onRightEdit(editKey, withStoredLineEndings(text, rightStored)),
    [onRightEdit, editKey, rightStored],
  );

  const canEdit = version => !readOnly && !SKILL_FILES_READ_ONLY_STATUSES.includes(version?.status);
  const showsSameText =
    Boolean(activeEntry?.left && activeEntry?.right) &&
    isTextCompare &&
    leftValue !== undefined &&
    leftValue === rightValue;
  const sameTextNote =
    leftRaw === rightRaw
      ? 'No differences in this file.'
      : 'Only line endings or the byte order mark differ.';
  const note = showsSameText ? sameTextNote : undefined;

  return (
    <Box
      sx={styles.root}
      data-testid="skill-compare-files-step"
    >
      <Box sx={[styles.headerCell, styles.panelHeader]}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Files
        </Typography>
        <Switch.BaseSwitch
          label="Only changed"
          checked={onlyChanged}
          onChange={(event, checked) => setOnlyChanged(checked)}
          slotProps={ONLY_CHANGED_SLOT_PROPS}
        />
      </Box>
      <Box sx={[styles.headerCell, styles.dividedCell]}>
        <CompareVersionHeader
          version={leftVersion}
          save={isTextCompare || leftHeaderSave?.isDirty ? leftHeaderSave : undefined}
          saveTestId="compare-header-save-left"
        />
      </Box>
      <Box sx={styles.headerCell}>
        <CompareVersionHeader
          version={rightVersion}
          save={isTextCompare || rightHeaderSave?.isDirty ? rightHeaderSave : undefined}
          saveTestId="compare-header-save-right"
        />
      </Box>
      <Box sx={styles.panel}>
        <Typography
          variant="bodySmall"
          color="text.primary"
          sx={styles.summary}
          data-testid="skill-compare-files-summary"
        >
          {summary || 'No differences in files'}
        </Typography>
        <SkillCompareFileTree
          root={root}
          selectedPath={activeEntry?.path}
          onSelect={setSelectedPath}
        />
      </Box>
      <Box sx={[styles.bodyCell, styles.dividedCell]}>
        {activeEntry && (
          <SkillCompareFileSide
            side="left"
            file={activeEntry.left}
            versionName={leftVersion?.name}
            isChanged={activeEntry.status !== SKILL_COMPARE_FILE_STATUS.same}
            isTextCompare={isTextCompare}
            value={leftValue}
            otherValue={activeEntry.right ? rightValue : undefined}
            isLoading={leftText.isFetching && leftValue === undefined}
            error={leftText.error}
            note={note}
            canEdit={canEdit(leftVersion)}
            onChange={handleLeftChange}
            onDownload={downloadLeft}
          />
        )}
      </Box>
      <Box sx={styles.bodyCell}>
        {activeEntry && (
          <SkillCompareFileSide
            side="right"
            file={activeEntry.right}
            versionName={rightVersion?.name}
            isChanged={activeEntry.status !== SKILL_COMPARE_FILE_STATUS.same}
            isTextCompare={isTextCompare}
            value={rightValue}
            otherValue={activeEntry.left ? leftValue : undefined}
            isLoading={rightText.isFetching && rightValue === undefined}
            error={rightText.error}
            note={note}
            canEdit={canEdit(rightVersion)}
            onChange={handleRightChange}
            onDownload={downloadRight}
          />
        )}
      </Box>
    </Box>
  );
});

SkillCompareFilesStep.displayName = 'SkillCompareFilesStep';

/** @type {MuiSx} */
const skillCompareFilesStepStyles = () => ({
  root: {
    display: 'grid',
    gridTemplateColumns: '20rem minmax(0, 1fr) minmax(0, 1fr)',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  headerCell: ({ palette }) => ({
    padding: '0.75rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    minWidth: 0,
  }),
  panelHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    borderRight: `0.0625rem solid ${palette.border.lines}`,
  }),
  dividedCell: ({ palette }) => ({
    borderRight: `0.0625rem solid ${palette.border.lines}`,
  }),
  panel: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem 1.5rem 1rem',
    minHeight: 0,
    overflowY: 'auto',
    borderRight: `0.0625rem solid ${palette.border.lines}`,
  }),
  summary: ({ palette }) => ({
    flexShrink: 0,
    padding: '0.25rem 0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  bodyCell: {
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
});

export default SkillCompareFilesStep;
