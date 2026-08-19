import { PinEntityConstants } from '@/[fsd]/shared/lib/constants';

const CONTENT_TYPE_MAPPING = [
  {
    match: ['application', 'pipeline', 'agent'],
    type: PinEntityConstants.PinEntityType.Application,
  },
  {
    match: ['toolkit', 'mcp'],
    type: PinEntityConstants.PinEntityType.Toolkit,
  },
  {
    match: ['credential', 'configuration'],
    type: PinEntityConstants.PinEntityType.Configuration,
  },
  {
    match: ['skill'],
    type: PinEntityConstants.PinEntityType.Skill,
  },
];

export const mapContentTypeToEntityType = contentType => {
  const lower = contentType.toLowerCase();

  for (const group of CONTENT_TYPE_MAPPING) {
    if (group.match.some(substr => lower.includes(substr))) {
      return group.type;
    }
  }

  return PinEntityConstants.PinEntityType.Application;
};
