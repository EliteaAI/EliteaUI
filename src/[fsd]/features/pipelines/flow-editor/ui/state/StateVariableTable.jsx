import React, { memo, useCallback, useState } from 'react';

import { Switch, ThemeProvider, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { DataGrid, GridRowEditStopReasons, gridClasses, useGridApiRef } from '@mui/x-data-grid';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { FlowEditorSettings } from '@/[fsd]/features/pipelines/flow-editor/ui';
import AlertDialog from '@/components/AlertDialog.jsx';
import DeleteIcon from '@/components/Icons/DeleteIcon.jsx';
import useAlitaTheme from '@/hooks/useAlitaTheme';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const isRowSelectable = () => false;
const getRowHeight = () => 'auto';

const StateVariableTable = memo(props => {
  const { rows, setRows, setRowModesModel, rowModesModel, cellModesModel, setCellModesModel } = props;
  const { toastError } = useToast();

  const theme = useTheme();
  const { localGridTheme } = useAlitaTheme();
  const apiRef = useGridApiRef();

  const handleRowEditStop = useCallback(
    params => event => {
      if (params.reason === GridRowEditStopReasons.rowFocusOut) {
        event.defaultMuiPrevented = true;
      }
    },
    [],
  );

  const handleDeleteClick = useCallback(
    async id => {
      setRows(rows.filter(row => row.id !== id));
    },
    [rows, setRows],
  );

  const processRowUpdate = useCallback(
    async newRow => {
      let updatedRow = { ...newRow, isNew: false };

      if (
        (newRow.type === FlowEditorConstants.StateVariableTypes.Json ||
          newRow.type === FlowEditorConstants.StateVariableTypes.List) &&
        typeof newRow.value === 'string'
      ) {
        try {
          updatedRow.value = JSON.parse(newRow.value);
          // eslint-disable-next-line no-unused-vars
        } catch (error) {
          //updatedRow.value = ''
        }
      }

      updatedRow = { ...updatedRow };
      setRows(rows.map(row => (row.id === newRow.id ? updatedRow : row)));
      return updatedRow;
    },
    [rows, setRows],
  );

  const isCellEditable = useCallback(params => {
    const disableEditFields = [];
    const isNameOrTypeOfInputOrMessages = params.row.id === 'input' || params.row.id === 'messages';
    return params.row?.isNew
      ? true
      : !disableEditFields.includes(params.field) && !isNameOrTypeOfInputOrMessages;
  }, []);

  const headerColumn = name => {
    return <>{name}</>;
  };

  const onProcessRowUpdateError = useCallback(() => {
    // Row update error handler
  }, []);

  const [openAlert, setOpenAlert] = useState(null);
  const [openAlertType, setOpenAlertType] = useState('');

  const onClickDelete = id => () => {
    setOpenAlert(id); // show alert dialog
    setOpenAlertType('delete');
  };

  const onCloseAlert = () => () => {
    setOpenAlert(null);
    setOpenAlertType('');
  };

  const onConfirmAlert = id => () => {
    switch (openAlertType) {
      case 'delete':
        handleDeleteClick(id);
        break;
      case 'hide':
        break;
    }

    onCloseAlert()();
  };

  const onCellClick = useCallback(
    params => {
      if (params.isEditable && params.cellMode !== 'edit') {
        apiRef.current.startCellEditMode({ id: params.id, field: params.field });
      }
    },
    [apiRef],
  );

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      editable: true,
      cellClassName: 'textPrimary',
      minWidth: 240,
      flex: 1,
      disableColumnSort: true,
      renderHeader: () => {
        return headerColumn('Name');
      },
      renderCell: params => {
        const { row } = params;
        return (
          <Typography
            variant="bodyMedium"
            color="text.Secondary"
          >
            {row.name}
          </Typography>
        );
      },
      renderEditCell: params => {
        return (
          <FlowEditorSettings.EditCellInput
            {...params}
            multiline={false}
            maxLength={30}
            onChangeValue={(inputValue, callback) => {
              const hasNameBeenUsed = rows.map(row => row.name).includes(inputValue);
              if (/^[a-zA-Z]\w*$/.test(inputValue) && !hasNameBeenUsed) {
                const rowData = apiRef.current.getRow(params.id);
                apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: inputValue });
                setRows(
                  rows.map(row =>
                    row.id === params.id ? { ...rowData, isNew: false, [params.field]: inputValue } : row,
                  ),
                );
              } else {
                if (inputValue) {
                  toastError(
                    hasNameBeenUsed
                      ? 'The name has already existed! Please input a new name'
                      : 'Only letters, numbers and underscore are allowed. And it should starts with a letter!',
                  );
                  callback(true);
                } else {
                  const rowData = apiRef.current.getRow(params.id);
                  apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: inputValue });
                  setRows(
                    rows.map(row =>
                      row.id === params.id ? { ...rowData, isNew: false, [params.field]: inputValue } : row,
                    ),
                  );
                }
              }
            }}
          />
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      editable: true,
      cellClassName: 'textPrimary',
      width: 140,
      disableColumnSort: true,
      renderHeader: () => {
        return headerColumn('Type');
      },
      renderCell: params => {
        const { row } = params;
        return (
          <Typography
            variant="bodyMedium"
            color={'text.Secondary'}
          >
            {FlowEditorConstants.StatueTypeMap[row.type]}
          </Typography>
        );
      },
      renderEditCell: params => {
        return (
          <FlowEditorSettings.EditCellTypeSelect
            {...params}
            rows={rows}
            setRows={setRows}
          />
        );
      },
    },
    {
      field: 'value',
      headerName: 'Default value(optional)',
      editable: true,
      cellClassName: 'textPrimary',
      minWidth: 200,
      flex: 1,
      disableColumnSort: true,
      renderHeader: () => {
        return headerColumn('Default value(optional)');
      },
      renderCell: params => {
        const { row } = params;
        return (
          <Typography
            variant="bodyMedium"
            color={'text.Secondary'}
            sx={{ whiteSpaceCollapse: 'preserve' }}
          >
            {row.value
              ? row.type === FlowEditorConstants.StateVariableTypes.Json ||
                row.type === FlowEditorConstants.StateVariableTypes.List
                ? JSON.stringify(row.value, null, 2)
                : row.value
              : '-'}
          </Typography>
        );
      },
      renderEditCell: params => {
        return (
          <FlowEditorSettings.EditCellInput
            {...params}
            hasActionsToolBar
            onChangeValue={inputValue => {
              const rowData = apiRef.current.getRow(params.id);
              apiRef.current.setEditCellValue({ id: params.id, field: params.field, value: inputValue });
              setRows(
                rows.map(row =>
                  row.id === params.id ? { ...rowData, isNew: false, [params.field]: inputValue } : row,
                ),
              );
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      sortable: false,
      width: 90,
      headerAlign: 'right',
      align: 'right',
      cellClassName: 'actions',
      getActions: ({ id, row }) => {
        const { name } = row;
        return name === FlowEditorConstants.STATE_INPUT || name === FlowEditorConstants.STATE_MESSAGES
          ? [
              <Switch
                key={`switch-${id}`}
                checked={row.enabled}
                color="primary"
                onChange={event => {
                  setRows(
                    rows.map(item => (item.id === id ? { ...item, enabled: event.target.checked } : item)),
                  );
                }}
              />,
            ]
          : [
              <IconButton
                key={`delete-button-${id}`}
                variant="alita"
                id={`basic-button-${id}`}
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={onClickDelete(id)}
                sx={{
                  marginLeft: '0rem',
                }}
                size="small"
                color="tertiary"
              >
                <DeleteIcon sx={{ fontSize: '1rem' }} />
              </IconButton>,
              <AlertDialog
                key={`alert-dialog-${id}`}
                id={`alert-dialog-${id}`}
                title="Delete"
                alertContent={`Are you sure to delete ${name ? 'this member ' + name : 'this member without name'}?`}
                open={openAlert === id}
                onClose={onCloseAlert()}
                onCancel={onCloseAlert()}
                onConfirm={onConfirmAlert(id)}
                alarm={openAlertType === 'delete'}
                confirmButtonText="Confirm"
              />,
            ];
      },
    },
  ];

  return (
    <Box
      className="nopan nodrag"
      sx={{
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
          justifyContent: 'center',
        },
        '& .textPrimary': {
          color: 'text.secondary',
        },
        [`.${gridClasses.cell}.error`]: {
          // backgroundColor: theme.palette.background.warningBkg,
          borderBottom: `.0625rem solid ${theme.palette.border.error} !important`,
        },
      }}
    >
      <ThemeProvider theme={localGridTheme}>
        <DataGrid
          apiRef={apiRef}
          disableColumnSorting
          variant={'alita'}
          rows={rows}
          columns={columns}
          disableRowSelectionOnClick
          editMode="cell"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          cellModesModel={cellModesModel}
          onCellModesModelChange={setCellModesModel}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={onProcessRowUpdateError}
          isCellEditable={isCellEditable}
          columnResizeIcon={false}
          densityCompactIcon={false}
          disableColumnMenu={true}
          slotProps={{
            toolbar: {
              setRows,
              setRowModesModel,
              cellModesModel,
              setCellModesModel,
            },
            cell: {},
          }}
          sx={{
            '& .MuiDataGrid-columnHeader': {
              paddingX: '.625rem',
            },
            '& .MuiDataGrid-cell': {
              '&.MuiDataGrid-cell--editing:focus-within': {
                outline: 'none !important', // Remove the outline effect when the cell contains a focused element
              },
              '&.MuiDataGrid-cell--editing': {
                backgroundColor: 'transparent',
                borderBottom: `.0625rem solid ${theme.palette.primary.main} !important`,
              },
            },
          }}
          isRowSelectable={isRowSelectable}
          getRowHeight={getRowHeight}
          onCellClick={onCellClick}
          hideFooter={true}
          getCellClassName={params => {
            if (params.field === 'name' && !params.value && !params.hasFocus) {
              return 'error';
            }
            return '';
          }}
        />
      </ThemeProvider>
    </Box>
  );
});

StateVariableTable.displayName = 'StateVariableTable';

export default StateVariableTable;
