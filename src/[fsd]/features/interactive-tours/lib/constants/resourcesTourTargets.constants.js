import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const RESOURCES_TOUR_TARGET_IDS = {
  page: 'resources-page',
  documentationCard: 'resources-documentation-card',
  releaseNotesCard: 'resources-release-notes-card',
  videoLibraryCard: 'resources-video-library-card',
  tutorialsCard: 'resources-tutorials-card',
  interactiveToursCard: 'resources-interactive-tours-card',
};

export const RESOURCES_TOUR_TARGETS = {
  page: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.page),
  documentationCard: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.documentationCard),
  releaseNotesCard: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.releaseNotesCard),
  videoLibraryCard: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.videoLibraryCard),
  tutorialsCard: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.tutorialsCard),
  interactiveToursCard: buildTourSelector(RESOURCES_TOUR_TARGET_IDS.interactiveToursCard),
};
