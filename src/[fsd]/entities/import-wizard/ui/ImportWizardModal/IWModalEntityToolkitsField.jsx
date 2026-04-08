import { memo } from 'react';

import { Box, Tooltip, Typography, useTheme } from '@mui/material';

import { getToolIconByType } from '@/common/toolkitUtils';
import AttentionIcon from '@/components/Icons/AttentionIcon';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

const IWModalEntityToolkitsField = memo(props => {
  const { toolkits, direction = 'row', hideTitle = false } = props;
  const theme = useTheme();

  const styles = iWModalEntityToolkitsFieldStyles();

  return (
    <Box>
      {!hideTitle && <Typography sx={styles.label}>Toolkits:</Typography>}
      <Box
        sx={[
          styles.wrapper,
          ...(direction === 'column' ? [{ flexDirection: 'column', alignItems: 'flex-start' }] : []),
        ]}
      >
        {toolkits.map((toolkit, idx) => (
          <Box
            key={`${toolkit.name}_${idx}`}
            sx={styles.toolkitItem}
          >
            <Box sx={styles.typeBlock}>
              {getToolIconByType(toolkit.type, theme)}
              <Typography
                sx={styles.toolkitType}
                variant="bodyMedium"
              >
                {ToolTypes[toolkit.type]?.label || toolkit.type}
              </Typography>
            </Box>
            <Tooltip
              title={
                toolkit.errors?.length ? (
                  <>
                    {toolkit.errors.map((error, index) => (
                      <Box
                        component="div"
                        key={index}
                      >
                        {error}
                      </Box>
                    ))}
                  </>
                ) : (
                  ''
                )
              }
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    maxWidth: '31.25rem',
                  },
                },
              }}
            >
              <Typography
                variant="bodyMedium"
                margin="0 .5rem"
                sx={styles.toolkitName}
              >
                {toolkit.name}
                {toolkit.isValid === false && <AttentionIcon />}
              </Typography>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

IWModalEntityToolkitsField.displayName = 'IWModalEntityToolkitsField';

/** @type {MuiSx} */
const iWModalEntityToolkitsFieldStyles = () => ({
  label: {
    fontWeight: 500,
    fontSize: '.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '1rem',
    marginTop: '.25rem',
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  toolkitItem: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '2rem',
    borderRadius: '.9375rem',
    background: palette.background.userInputBackgroundActive,
    padding: '.25rem',
  }),
  toolkitName: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    color: palette.text.secondary,
    fontWeight: 400,
    fontSize: '.75rem',
    lineHeight: '1rem',

    svg: {
      width: '1rem',
      minWidth: '1rem',

      path: {
        fill: palette.background.warning,
      },
    },
  }),
  typeBlock: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '.25rem',
    borderRadius: '1.4375rem',
    background: palette.background.dataGrid.main,
    padding: '.3125rem .5rem',
    height: '1.5rem',
    border: `0.0625rem solid ${palette.background.userInputBackgroundActive}`,

    svg: {
      width: '.875rem',
      height: '.875rem',
    },
  }),
  toolkitType: ({ palette }) => ({
    color: palette.secondary.main,
    fontWeight: 400,
    fontSize: '.875rem',
    lineHeight: '1rem',
  }),
});

export default IWModalEntityToolkitsField;
