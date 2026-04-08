import { memo } from 'react';

import { Box } from '@mui/system';

import { CollectionStatus } from '@/common/constants';

const ToolkitsEmptyListPlaceHolder = memo(props => {
  const { query, status, isMCP } = props;

  const entityName = isMCP ? 'MCPs' : 'toolkits';

  if (query) {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }

  switch (status) {
    case CollectionStatus.UserApproval:
      return <Box>{`You have no approval ${entityName}.`}</Box>;

    case CollectionStatus.Draft:
      return <Box>{`You have no draft ${entityName}.`}</Box>;

    case CollectionStatus.OnModeration:
      return <Box>{`You have no ${entityName} on moderation.`}</Box>;

    case CollectionStatus.Rejected:
      return <Box>{`You have no rejected ${entityName}.`}</Box>;

    case CollectionStatus.Published:
      return <Box>{`You have no published ${entityName}.`}</Box>;

    default:
      return <Box>{`You have no ${entityName}.`}</Box>;
  }
});

ToolkitsEmptyListPlaceHolder.displayName = 'ToolkitsEmptyListPlaceHolder';

export default ToolkitsEmptyListPlaceHolder;
