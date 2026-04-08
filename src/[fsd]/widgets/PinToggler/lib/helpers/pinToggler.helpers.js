import { PinEntityType } from '@/[fsd]/widgets/PinToggler/lib/constants';

const CONTENT_TYPE_MAPPING = [
  {
    match: ['application', 'pipeline', 'agent'],
    type: PinEntityType.Application,
  },
  {
    match: ['toolkit', 'mcp'],
    type: PinEntityType.Toolkit,
  },
  {
    match: ['credential', 'configuration'],
    type: PinEntityType.Configuration,
  },
];

export const mapContentTypeToEntityType = contentType => {
  const lower = contentType.toLowerCase();

  for (const group of CONTENT_TYPE_MAPPING) {
    if (group.match.some(substr => lower.includes(substr))) {
      return group.type;
    }
  }

  return PinEntityType.Application;
};
