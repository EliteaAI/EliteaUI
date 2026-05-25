import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const ARTIFACT_TOUR_TARGET_IDS = {
  workspace: 'artifacts-workspace',
  bucketsPanel: 'artifacts-buckets-panel',
  storageSelector: 'artifacts-storage-selector',
  uploadButton: 'artifacts-upload-button',
  fileTable: 'artifacts-file-table',
  selectedFile: 'artifacts-selected-file',
};

export const ARTIFACT_TOUR_TARGETS = {
  workspace: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.workspace),
  bucketsPanel: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.bucketsPanel),
  storageSelector: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.storageSelector),
  uploadButton: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.uploadButton),
  fileTable: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.fileTable),
  selectedFile: buildTourSelector(ARTIFACT_TOUR_TARGET_IDS.selectedFile),
};
