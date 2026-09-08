import { memo } from 'react';

import { Link, SvgIcon, Tooltip } from '@mui/material';

import HelpCenterIcon from '@/assets/help-center.svg?react';

import { EVALUATION_DOCS_URL } from '../../lib/constants';

/**
 * Info button sitting opposite the breadcrumbs in every Evaluation page header, matching the one
 * beside Support in the sidebar. Rendered as an anchor rather than a click handler so the browser
 * opens the tab itself — copy-link, middle-click and cmd-click all keep working, and nothing is
 * lost to a popup blocker.
 */
const EvaluationDocsButton = memo(props => {
  const { sx = {} } = props;

  const styles = evaluationDocsButtonStyles();

  return (
    <Tooltip
      title="Evaluation documentation"
      placement="bottom"
    >
      <Link
        href={EVALUATION_DOCS_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Evaluation documentation"
        sx={[styles.root, sx]}
        data-testid="evaluation-docs-button"
      >
        <SvgIcon
          component={HelpCenterIcon}
          inheritViewBox
          sx={styles.icon}
        />
      </Link>
    </Tooltip>
  );
});

EvaluationDocsButton.displayName = 'EvaluationDocsButton';

/** @type {MuiSx} */
const evaluationDocsButtonStyles = () => ({
  root: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    color: palette.text.metrics,
    background: 'transparent',
    '&:hover': {
      backgroundColor: palette.background.button.drawerMenu.hover,
    },
    '&:active': {
      backgroundColor: palette.background.button.drawerMenu.selected,
    },
  }),
  icon: {
    // The sidebar's copy of this button hands `sx` to an SVGR component, which drops it, so the
    // icon there renders at the asset's intrinsic 14px. Matching that keeps the two the same size.
    fontSize: '0.875rem',
  },
});

export default EvaluationDocsButton;
