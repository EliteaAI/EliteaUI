import {
  isApplicationCard,
  isCredentialCard,
  isMCPCard,
  isPipelineCard,
  isSkillCard,
  isToolkitCard,
} from '@/common/checkCardType';

import { ENTITY_FOLDER_TYPES } from '../constants';

/**
 * Maps a ContentType card type to the corresponding folder entity type.
 * @param {string} cardType - ContentType value (e.g. 'ApplicationAll', 'PipelineAdmin')
 * @returns {string|null} - ENTITY_FOLDER_TYPES value or null if not supported
 */
export const getFolderEntityType = cardType => {
  if (isApplicationCard(cardType)) return ENTITY_FOLDER_TYPES.agent;
  if (isPipelineCard(cardType)) return ENTITY_FOLDER_TYPES.pipeline;
  if (isSkillCard(cardType)) return ENTITY_FOLDER_TYPES.skill;
  if (isToolkitCard(cardType)) return ENTITY_FOLDER_TYPES.toolkit;
  if (isMCPCard(cardType)) return ENTITY_FOLDER_TYPES.mcp;
  if (isCredentialCard(cardType)) return ENTITY_FOLDER_TYPES.configuration;
  return null;
};
