import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import IssueItem from '@/[fsd]/entities/version/ui/IssueItem';

const SECTION_IDS = {
  critical: 'validation-critical',
  warnings: 'validation-warnings',
  suggestions: 'validation-suggestions',
};

const DetailsContent = memo(props => {
  const { critical_issues, warnings, recommendations } = props;
  return (
    <Box sx={styles.detailsContent}>
      {critical_issues.length > 0 && (
        <Box id={SECTION_IDS.critical}>
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Critical Issues ({critical_issues.length})
          </Typography>
          {critical_issues.map((item, idx) => (
            <IssueItem
              key={idx}
              item={item}
              type="critical"
            />
          ))}
        </Box>
      )}
      {warnings.length > 0 && (
        <Box id={SECTION_IDS.warnings}>
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Warnings ({warnings.length})
          </Typography>
          {warnings.map((item, idx) => (
            <IssueItem
              key={idx}
              item={item}
              type="warning"
            />
          ))}
        </Box>
      )}
      {recommendations.length > 0 && (
        <Box id={SECTION_IDS.suggestions}>
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Suggestions ({recommendations.length})
          </Typography>
          {recommendations.map((item, idx) => (
            <IssueItem
              key={idx}
              item={item}
              type="suggestion"
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

DetailsContent.displayName = 'DetailsContent';

/** @type {MuiSx} */
const styles = {
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
};

export default DetailsContent;
