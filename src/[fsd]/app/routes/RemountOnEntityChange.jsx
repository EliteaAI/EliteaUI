import { Fragment, memo } from 'react';

import { useParams } from 'react-router-dom';

/**
 * Remounts the editor page whenever the route moves to another agent or pipeline. The route itself is keyed by
 * its path, so without this the form, the flow editor and their pending timers carry over between entities.
 * Version changes inside one entity (`/:agentId/:version`) keep the same instance.
 */
const RemountOnEntityChange = memo(props => {
  const { children } = props;
  const { agentId } = useParams();

  return <Fragment key={agentId}>{children}</Fragment>;
});

RemountOnEntityChange.displayName = 'RemountOnEntityChange';

export default RemountOnEntityChange;
