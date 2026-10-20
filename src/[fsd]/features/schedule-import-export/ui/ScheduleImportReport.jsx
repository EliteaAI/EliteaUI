import { memo } from 'react';

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, List, ListItem, Typography } from '@mui/material';

const GROUPS = [
  { key: 'created', title: 'Created', icon: 'success', Icon: CheckCircleOutlineIcon, color: 'success.main' },
  { key: 'skipped', title: 'Skipped', icon: 'info', Icon: InfoOutlinedIcon, color: 'info.main' },
  { key: 'failed', title: 'Failed', icon: 'error', Icon: ErrorOutlineIcon, color: 'error.main' },
];

const ScheduleImportReport = memo(({ report }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {GROUPS.map(({ key, title, icon, Icon, color }) => {
      const items = report?.[key] ?? [];
      if (!items.length) return null;
      return (
        <Box
          key={key}
          data-testid={`import-report-${key}`}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon
              data-testid={`import-report-icon-${icon}`}
              fontSize="small"
              sx={{ color }}
            />
            <Typography variant="labelMedium">{`${title} (${items.length})`}</Typography>
          </Box>
          <List
            dense
            disablePadding
            sx={{ marginTop: '0.25rem', paddingLeft: '2rem' }}
          >
            {items.map(({ name, note, reason }, index) => (
              <ListItem
                key={`${name}-${index}`}
                disableGutters
                sx={{ display: 'list-item', listStyleType: 'disc' }}
              >
                <Typography variant="bodySmall">
                  {[name, note ?? reason].filter(Boolean).join(' - ')}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      );
    })}
  </Box>
));

ScheduleImportReport.displayName = 'ScheduleImportReport';

export default ScheduleImportReport;
