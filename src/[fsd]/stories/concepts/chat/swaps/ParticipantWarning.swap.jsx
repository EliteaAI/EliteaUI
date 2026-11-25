// Switch for the warning line of a participant that needs attention (imported by ParticipantAttentionCard in
// Storybook, see .storybook/main.js). In the «who answers» list a misconfigured agent, pipeline or toolkit gets a «Fix»
// button on its row (ConceptParticipantActions), so the line keeps only the text: «Misconfiguration errors found.»
// without the link «Check the <kind>». A remote MCP server, a SharePoint or an OpenAPI toolkit the user is logged out
// of gets a «Log in» button on its row the same way (ConceptRowLogIn), so its line keeps only the team's text without
// the link «Log in.». Every other warning, and every row outside the list, is the team's ParticipantWarning as is.
import { memo } from 'react';

import ParticipantWarning from '@/[fsd]/features/chat/participants/ui/expanded-participants/ParticipantWarning';

import { LOG_IN_TEXT, fixOnRow, logInOnRow } from '../conceptRowLogIn.helpers';
import { useConceptSwap } from '../conceptSwap.hooks';
import { useWhoAnswers } from '../whoAnswersContext.hooks';

const asSentence = message => (/[.!?]$/.test(message) ? message : `${message}.`);

const ParticipantWarningSwap = memo(props => {
  const { whoAnswers } = useConceptSwap();
  const { inList } = useWhoAnswers();
  const fixedOnRow = whoAnswers && inList && fixOnRow(props);
  const logInKind = whoAnswers && inList ? logInOnRow(props) : null;
  if (logInKind) return LOG_IN_TEXT[logInKind];
  if (!fixedOnRow) return <ParticipantWarning {...props} />;
  return props.connectionNotice
    ? asSentence(props.connectionNotice.message)
    : 'Misconfiguration errors found.';
});

ParticipantWarningSwap.displayName = 'ParticipantWarningSwap';

export default ParticipantWarningSwap;
