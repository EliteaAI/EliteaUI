import { memo, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button, Modal } from '@/[fsd]/shared/ui';

/**
 * Shared, presentational import "entity card" used by the import flows
 * (Agents/Pipelines and Skills) so the look & feel stays consistent in one place.
 *
 * It renders the card header (icon + title + subtitle + Show/Hide details), an
 * expandable details area, and a full-screen previewer modal. Detail fields are
 * provided by the caller via a render-prop that receives `setFullscreenData`
 * (so fields can open the previewer). The previewer renders plain text by
 * default; pass `renderFullscreenContent` to customize (e.g. a diagram).
 *
 * @param {object}        props
 * @param {React.ReactNode} props.icon       Icon element rendered in the avatar.
 * @param {string}        props.title        Entity name.
 * @param {string}        [props.subtitle]   e.g. "Type: agent" / "Type: Skill | Version: base".
 * @param {boolean}       [props.defaultExpanded=false]
 * @param {(setFullscreenData: Function) => React.ReactNode} props.children  Detail fields.
 * @param {(fullscreenData: object) => React.ReactNode} [props.renderFullscreenContent]
 */
const ImportEntityCard = memo(props => {
  const { icon, title, subtitle, defaultExpanded = false, children, renderFullscreenContent } = props;

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [fullscreenData, setFullscreenData] = useState(null);

  const styles = importEntityCardStyles(isExpanded);

  return (
    <>
      <Box sx={styles.entityCard}>
        <Box sx={styles.mainBlock}>
          <Box sx={styles.entityIcon}>{icon}</Box>
          <Box sx={styles.entityTitles}>
            <Typography sx={styles.titleText}>{title}</Typography>
            {subtitle && <Typography sx={styles.typeText}>{subtitle}</Typography>}
          </Box>
          <Button.BaseBtn
            sx={styles.actionBtn}
            variant="auxiliary"
            onClick={() => setIsExpanded(prev => !prev)}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </Button.BaseBtn>
        </Box>

        <Box sx={styles.detailsBlock}>
          <Box sx={styles.detailsInner}>
            {typeof children === 'function' ? children(setFullscreenData) : children}
          </Box>
        </Box>
      </Box>

      <Modal.BaseModal
        hideSections
        open={Boolean(fullscreenData)}
        title={fullscreenData?.title}
        dialogSx={{ maxHeight: 'unset' }}
        onClose={() => setFullscreenData(null)}
        content={
          renderFullscreenContent ? (
            renderFullscreenContent(fullscreenData)
          ) : (
            <ImportEntityFullscreenText content={fullscreenData?.content} />
          )
        }
      />
    </>
  );
});

ImportEntityCard.displayName = 'ImportEntityCard';

/** Standard text body for the full-screen previewer (shared so it stays consistent). */
export const ImportEntityFullscreenText = memo(({ content }) => {
  const styles = importEntityCardStyles(false);
  return (
    <Box sx={[styles.textBlock, { height: '34rem', overflowY: 'auto' }]}>
      <Typography
        variant="bodySmall"
        sx={styles.fullScreenText}
        component="p"
      >
        {content}
      </Typography>
    </Box>
  );
});

ImportEntityFullscreenText.displayName = 'ImportEntityFullscreenText';

/** @type {(isExpanded: boolean) => MuiSx} */
export const importEntityCardStyles = isExpanded => ({
  entityCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 1rem',
    width: '100%',
    background: palette.background.userInputBackground,
    borderRadius: '.5rem',
    overflow: 'hidden',
  }),
  mainBlock: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: '3.75rem',
  },
  detailsBlock: {
    display: 'grid',
    gridTemplateRows: isExpanded ? '1fr' : '0fr',
    transition: 'grid-template-rows 0.4s ease',
  },
  detailsInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
    paddingTop: isExpanded ? '1.75rem' : '0',
    transition: 'padding-top 0.4s ease',
    marginBottom: isExpanded ? '1rem' : '0',
  },
  entityIcon: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '2.25rem',
    width: '2.25rem',
    minHeight: '2.25rem',
    minWidth: '2.25rem',
    borderRadius: '50%',
    background: 'linear-gradient(225deg, rgba(169, 183, 193, 0.03) 12.64%, rgba(169, 183, 193, 0.17) 87.88%)',

    ':after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '50%',
      height: '2.1875rem',
      width: '2.1875rem',
      borderRadius: '50%',
      background: 'linear-gradient(45.36deg, rgba(169, 183, 193, 0.3) 16.25%, rgba(80, 86, 91, 0.3) 87.07%)',
      transform: 'translate(-50%, -50%)',
    },
  },
  entityTitles: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleText: ({ palette }) => ({
    fontWeight: '400',
    fontSize: '.875rem',
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
  typeText: ({ palette }) => ({
    fontWeight: 400,
    fontSize: '.75rem',
    lineHeight: '1.25rem',
    color: palette.text.default,
  }),
  actionBtn: {
    border: 'none !important',
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },
  textBlock: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    padding: '.5rem 1rem',
  }),
  fullScreenText: ({ palette }) => ({
    color: palette.text.secondary,
    lineHeight: '1rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
});

export default ImportEntityCard;
