import React, { useCallback } from 'react';

import { format } from 'date-fns';

import { ThemeProvider, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { DataGrid } from '@mui/x-data-grid';

import SortUpwardIcon from '@/components/Icons/SortUpwardIcon.jsx';
import NotificationListItem from '@/components/NotificationListItem';
import useAlitaTheme from '@/hooks/useAlitaTheme';
import { useTheme } from '@emotion/react';

export default function NotificationTable(props) {
  const { isFetching, rows, rowCount, rowModesModel, paginationModel, setPaginationModel } = props;
  const theme = useTheme();
  const { localGridTheme } = useAlitaTheme();
  const isCellEditable = useCallback(() => {
    return false;
  }, []);

  const headerColumn = name => {
    return (
      <>
        <IconButton
          sx={{ marginLeft: '0px' }}
          variant="alita"
          color="tertiary"
          size={'small'}
          disableRipple
        >
          <SortUpwardIcon sx={{ fontSize: '16px' }} />
        </IconButton>
        {name}
      </>
    );
  };

  const isRowSelectable = () => () => false;
  const getRowHeight = () => () => 'auto';

  const columns = [
    {
      field: 'event_type',
      headerName: 'Notification',
      editable: true,
      resizable: false,
      type: 'string',
      flex: 1,
      cellClassName: 'firstColumnOfNotification',
      renderHeader: () => {
        return headerColumn('Notification');
      },
      renderCell: params => {
        const { row } = params;
        return (
          <Box
            display="flex"
            height="52px"
            flexDirection="row"
            gap="8px"
            alignItems="center"
            sx={{ paddingLeft: row.is_seen ? '12px' : '0px' }}
          >
            {!row.is_seen && (
              <Box
                sx={{
                  height: '49px',
                  width: '4px',
                  borderRadius: '4px',
                  background: theme.palette.info.main,
                }}
              />
            )}
            <NotificationListItem
              notification={row}
              height="52px"
              sx={{ padding: '0px 0px' }}
              contentSX={{ justifyContent: 'center' }}
              showTime={false}
            />
          </Box>
        );
      },
    },
    {
      field: 'created_at',
      headerName: 'Date&Time',
      editable: true,
      resizable: false,
      type: 'string',
      flex: 1,
      renderHeader: () => {
        return headerColumn('Date&Time');
      },
      renderCell: params => {
        const { row } = params;
        return (
          <Typography variant="bodySmall">
            {format(new Date(row.created_at), 'dd-MMM-yyyy, kk:mm')}
          </Typography>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        maxHeight: 'calc(100vh - 100px)',
        '& .firstColumnOfNotification': {
          paddingLeft: '0px',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
      <ThemeProvider theme={localGridTheme}>
        <DataGrid
          autoHeight
          variant="alita"
          rowCount={rowCount}
          rows={rows}
          columns={columns}
          disableSelectionOnClick
          editMode="row"
          rowModesModel={rowModesModel}
          isCellEditable={isCellEditable}
          columnResizeIcon={false}
          densityCompactIcon={false}
          disableColumnMenu={true}
          isRowSelectable={isRowSelectable()}
          getRowHeight={getRowHeight()}
          disableRowSelectionOnClick={true}
          pageSizeOptions={[5, 10, 50, 100]}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          loading={isFetching}
        />
      </ThemeProvider>
    </Box>
  );
}
