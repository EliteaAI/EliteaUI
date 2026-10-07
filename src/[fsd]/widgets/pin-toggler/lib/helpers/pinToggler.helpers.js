import { PinEntityConstants } from '@/[fsd]/shared/lib/constants';
import { ContentType } from '@/common/constants';

const CONTENT_TYPE_MAPPING = [
  {
    // Apps are integration applications stored as toolkits (not Agents/Pipelines).
    // Their list/detail endpoints read pins as `toolkit`, so pin writes must use it too.
    // Matched exactly: 'appall' would otherwise fall through to the Application default.
    exact: [ContentType.AppAll.toLowerCase()],
    type: PinEntityConstants.PinEntityType.Toolkit,
  },
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
    if (group.exact?.includes(lower) || group.match?.some(substr => lower.includes(substr))) {
      return group.type;
    }
  }

  return PinEntityConstants.PinEntityType.Application;
};
