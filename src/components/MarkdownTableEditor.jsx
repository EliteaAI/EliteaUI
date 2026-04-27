import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Box, IconButton, Link, TextField, Typography } from '@mui/material';
import { DataGrid, GRID_CHECKBOX_SELECTION_COL_DEF, gridClasses, useGridApiContext } from '@mui/x-data-grid';

import { Input } from '@/[fsd]/shared/ui';
import useDownloadTable, { downloadTableOptions } from '@/hooks/useDownloadTable';
import { useTheme } from '@emotion/react';

import AlertDialog from './AlertDialog';
import SortUpwardIcon from './Icons/SortUpwardIcon';
import Markdown from './Markdown';
import SplitButton from './SplitButton';

// Helper function to split a row while handling escaped pipes (\|)
function splitRow(row) {
  const cells = [];
  let currentCell = '';
  let isEscaped = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (isEscaped) {
      // If the previous character was a backslash, treat this character literally
      currentCell += char;
      isEscaped = false;
    } else if (char === '\\') {
      // If we encounter a backslash, set the escape flag
      isEscaped = true;
    } else if (char === '|') {
      // If we encounter a pipe, treat it as a column separator
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      // Otherwise, add the character to the current cell
      currentCell += char;
    }
  }

  // Add the last cell (after the final pipe)
  if (currentCell) {
    cells.push(currentCell.trim());
  }
  // console.log('cells=======>', cells)
  return cells;
}

// Parse Markdown into columns and rows
export const parseMarkdownTable = markdown => {
  const rows = markdown.trim().split('\n');
  const headers = splitRow(rows[0])
    .slice(1)
    .map(header => header.trim().replace(/<br>/g, '\n'));
  const dataRows = rows.slice(2).map((row, index) => {
    const splittedCells = splitRow(row).slice(1);
    const cells = splittedCells.map(cell => cell.trim().replace(/<br>/g, '\n'));
    const rowData = { id: index + 1 }; // Add a unique ID for each row
    headers.forEach((header, i) => {
      rowData[header] = cells[i] || ''; // Map headers to cell values
    });

    return rowData;
  });
  //  console.log('dataRows=======>', headers, dataRows)
  return { headers, rows: dataRows };
};

// Convert the grid back to Markdown
const convertToMarkdown = (columns, rows) => {
  const headers = columns.map(col => col.headerName.replace(/\n/g, '<br>').replace(/\|/g, '\\|')).join(' | ');
  const separator = columns.map(() => '---').join(' | ');
  const dataRows = rows
    .map(
      row =>
        `| ${columns.map(col => (row[col.field] || '').replace(/\n/g, '<br>').replace(/\|/g, '\\|')).join(' | ')} |`,
    )
    .join('\n');

  return columns.length ? `| ${headers} |\n| ${separator} |\n${dataRows}\n\n` : '';
};

function ExpandableCell({ value }) {
  const theme = useTheme();
  const styles = useMemo(() => componentStyles(theme), [theme]);
  const [expanded, setExpanded] = React.useState(false);
  const onClickExpand = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  return (
    <Typography
      variant="bodyMedium"
      color="text.secondary"
      sx={styles.expandableCellTypography}
    >
      {expanded ? value : value.slice(0, 200)}
      {value.length > 200 && (
        <>
          <br></br>
          <Link
            type="button"
            component="button"
            sx={styles.expandableCellLink}
            onClick={onClickExpand}
          >
            {expanded ? 'view less' : 'view more'}
          </Link>
        </>
      )}
    </Typography>
  );
}

const useInputFocus = () => {
  const inputRef = useRef();
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  return {
    inputRef,
  };
};

function CellEditor(props) {
  const { id, field, api, readOnly } = props;
  const [value, setValue] = useState(props.value || '');
  const { inputRef } = useInputFocus();

  const onChange = event => {
    setValue(event.target.value);
    setTimeout(() => {
      api.setEditCellValue({
        id,
        field,
        value,
      });
    }, 30);
  };

  const onBlur = () => {
    // Save the current value
    api.setEditCellValue({
      id,
      field,
      value,
    });
  };

  const onKeyDown = event => {
    const textarea = event.target;
    if ((event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) && event.key === 'Enter') {
      // Allow "Command + Enter" or "Ctrl + Enter" to insert a newline at the caret position
      event.preventDefault();
      event.stopPropagation();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      // Insert a newline at the caret position
      setValue(value.slice(0, start) + '\n' + value.slice(end));
      // Move the caret to the position after the newline
      setTimeout(() => {
        textarea.setSelectionRange?.(start + 1, start + 1);
      }, 0);
    } else if (event.key === 'Enter') {
      onBlur();
    }
  };

  return (
    <Input.StyledInputEnhancer
      onChange={onChange}
      value={value}
      showexpandicon="true"
      id=""
      label={''}
      multiline
      disabled={readOnly}
      maxRows={15}
      hasActionsToolBar
      fieldName="Cell content"
      containerProps={{
        width: '100%',
        marginBottom: '0px',
      }}
      actionsBarProps={{
        top: value ? '-10px' : '-6px',
        right: '-8px',
      }}
      disableUnderline
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      language={'text'}
      inputRef={inputRef}
    />
  );
}

function ColumnHeader({
  handleHeaderChangeRef,
  rows,
  setRows,
  sortModel,
  setSortModel,
  readOnly,
  ...params
}) {
  const theme = useTheme();
  const styles = useMemo(() => componentStyles(theme), [theme]);
  const apiRef = useGridApiContext();
  const onHeaderChange = e => {
    handleHeaderChangeRef.current?.(params.colDef.field, e.target.value);
  };

  const handleKeyDown = event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const currentColIndex = apiRef.current.getColumnIndex(params.field);
      const nextColIndex = event.key === 'ArrowRight' ? currentColIndex + 1 : currentColIndex - 1;
      const columns = apiRef.current.getAllColumns();

      if (nextColIndex >= 0 && nextColIndex < columns.length) {
        const nextField = columns[nextColIndex].field;
        const headerCell = apiRef.current.getColumnHeaderElement(nextField);
        headerCell?.focus();
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      const firstRowId = apiRef.current.getRowIdFromRowIndex(0);
      if (firstRowId != null) {
        apiRef.current.setCellFocus(firstRowId, params.field); // Focus the first cell in the column
      }
    }
  };

  const currentSort = sortModel.find(model => model.field === params.field);
  const handleSort = field => event => {
    event.stopPropagation();
    const newSortDirection = currentSort?.sort === 'asc' ? 'desc' : 'asc';

    const sortedRows = [...rows].sort((a, b) => {
      if (newSortDirection === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });

    setRows(sortedRows);
    setSortModel([{ field, sort: newSortDirection }]);
  };

  return (
    <Box
      display={'flex'}
      alignItems={'center'}
      onKeyDown={handleKeyDown}
    >
      <IconButton
        onClick={handleSort(params.field)}
        sx={{
          ...styles.columnHeaderSortButton,
          transform: currentSort?.sort === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
          ...(!currentSort?.sort ? {} : styles.columnHeaderSortButtonActive),
        }}
        variant="alita"
        color="tertiary"
        size={'small'}
        disableRipple
      >
        <SortUpwardIcon sx={{ fontSize: '16px' }} />
      </IconButton>
      <TextField
        value={params.colDef.headerName}
        onChange={onHeaderChange}
        onClick={event => event.stopPropagation()}
        variant="standard"
        fullWidth
        disabled={readOnly}
        slotProps={{
          input: styles.columnHeaderTextFieldInput,
          htmlInput: styles.columnHeaderTextFieldHtmlInput,
        }}
        sx={styles.columnHeaderTextField}
      />
    </Box>
  );
}

const MarkdownTableEditor = forwardRef(
  (
    {
      initialMarkdown,
      onChange,
      onCanUndo,
      onCanRedo,
      onRowsColumnsSelected,
      interaction_uuid,
      conversation_uuid,
      tableId,
      readOnly,
    },
    ref,
  ) => {
    const theme = useTheme();
    const styles = useMemo(() => componentStyles(theme), [theme]);
    const [debounceTimeout, setDebounceTimeout] = useState(null);
    const [openWarningAlert, setOpenWarningAlert] = useState(false);
    const { headers, rows: initialRows } = parseMarkdownTable(initialMarkdown);
    const handleHeaderChangeRef = useRef();

    const initialColumns = headers.map(header => ({
      field: header,
      headerName: header,
      editable: true, // Make cells editable
    }));
    const [rows, setRows] = useState(initialRows);
    const [columns, setColumns] = useState(initialColumns);
    const [history, setHistory] = useState([{ rows: initialRows, columns: initialColumns }]);
    const [historyIndex, setHistoryIndex] = useState(0);
    // Save the current state to history
    const saveToHistory = useCallback(
      (newRows, newColumns) => {
        const newHistory =
          historyIndex < history.length - 1 ? history.slice(0, historyIndex + 1) : [...history]; // Remove future states if undo was used
        newHistory.push({ rows: newRows, columns: newColumns });
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        onCanUndo?.(true);
        onCanRedo?.(false);
      },
      [history, historyIndex, onCanRedo, onCanUndo],
    );

    // Handle cell updates
    const handleProcessRowUpdate = useCallback(
      newRow => {
        const updatedRows = rows.map(row => (row.id === newRow.id ? { ...row, ...newRow } : row));
        saveToHistory(updatedRows, columns);
        setRows(updatedRows);
        return newRow;
      },
      [columns, rows, saveToHistory],
    );

    // Handle header updates
    const handleHeaderChange = useCallback(
      (field, newHeaderName) => {
        const updatedColumns = columns.map(col =>
          col.field === field ? { ...col, headerName: newHeaderName } : col,
        );
        setColumns(updatedColumns);
        saveToHistory(rows, updatedColumns);
      },
      [columns, rows, saveToHistory],
    );

    useEffect(() => {
      handleHeaderChangeRef.current = handleHeaderChange;
    }, [handleHeaderChange]);

    const [selectedCell, setSelectedCell] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [rowSelectionModel, setRowSelectionModel] = useState([]);
    const [sortModel, setSortModel] = useState([]);
    const [columnVisibilityModel, setColumnVisibilityModel] = useState(
      columns.reduce((prev, column) => {
        return {
          ...prev,
          [column.field]: true,
        };
      }, {}),
    );
    const visibleColumnsCount = useMemo(
      () =>
        Object.keys(columnVisibilityModel).reduce(
          (result, key) => result + (columnVisibilityModel[key] ? 1 : 0),
          0,
        ),
      [columnVisibilityModel],
    );

    const onCellClick = useCallback(params => {
      setSelectedCell({
        rowId: params.id, // ID of the row
        columnField: params.field, // Field of the column
      });
    }, []);

    const onColumnHeaderClick = useCallback(
      params => {
        setSelectedCell({
          rowId: undefined, // ID of the row
          columnField: params.field, // Field of the column
        });
        const columnField = params.field;
        if (selectedColumns.includes(columnField)) {
          // Deselect column if already selected
          setSelectedColumns(selectedColumns.filter(col => col !== columnField));
        } else {
          // Select column
          setSelectedColumns([...selectedColumns, columnField]);
        }
        setRowSelectionModel([]);
      },
      [selectedColumns],
    );

    const onRowSelectionModelChange = useCallback(newSelection => {
      setRowSelectionModel(newSelection);
      setSelectedColumns([]);
    }, []);

    const getCellClassName = useCallback(
      params => {
        return selectedColumns.includes(params.field) ? 'MuiDataGrid-cell--selected' : '';
      },
      [selectedColumns],
    );

    const getColumnHeaderClassName = useCallback(
      params => {
        return selectedColumns.includes(params.field) ? 'MuiDataGrid-columnHeader--selected' : '';
      },
      [selectedColumns],
    );

    // Add a new row
    const addRow = useCallback(() => {
      const newRow = { id: rows.length + 1 };
      columns.forEach(col => {
        newRow[col.field] = ''; // Add empty cells for each column
      });
      let updatedRows = [];
      if (!selectedCell?.rowId) {
        updatedRows = [...rows, newRow];
      } else {
        const currentRowIndex = rows.findIndex(row => row.id == selectedCell?.rowId);
        if (currentRowIndex != -1) {
          updatedRows = [...rows];
          updatedRows.splice(currentRowIndex + 1, 0, newRow);
        } else {
          updatedRows = [...rows, newRow];
        }
      }
      setRows(updatedRows);
      saveToHistory(updatedRows, columns);
    }, [columns, rows, saveToHistory, selectedCell?.rowId]);

    // Add a new column
    const addColumn = useCallback(() => {
      const newField = `Column_${columns.length + 1}`;
      const newColumn = {
        field: newField,
        headerName: newField,
        editable: true,
      };

      let updatedColumns = [];
      if (selectedCell?.columnField) {
        const currentColumnIndex = columns.findIndex(column => column.field == selectedCell?.columnField);
        if (currentColumnIndex != -1) {
          updatedColumns = [...columns];
          updatedColumns.splice(currentColumnIndex + 1, 0, newColumn);
        } else {
          updatedColumns = [...columns, newColumn];
        }
      } else {
        updatedColumns = [...columns, newColumn];
      }
      const updatedRows = rows.map(row => ({
        ...row,
        [newField]: '', // Add empty values for the new column
      }));
      saveToHistory(updatedRows, updatedColumns);
      setColumns(updatedColumns);
      setRows(updatedRows);
    }, [columns, rows, saveToHistory, selectedCell?.columnField]);

    // Undo functionality

    // Redo functionality
    const redo = useCallback(() => {
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        setRows(nextState.rows);
        setColumns(nextState.columns);
        setHistoryIndex(historyIndex + 1);
        onCanUndo?.(true);
        onCanRedo?.(historyIndex + 1 < history.length - 1);
      }
    }, [history, historyIndex, onCanRedo, onCanUndo]);

    const onConfirmDelete = () => {
      if (rowSelectionModel.length) {
        const newRows = rows.filter(row => !rowSelectionModel.includes(row.id));
        saveToHistory(newRows, columns);
        setRows(newRows);
        if (rowSelectionModel.includes(selectedCell?.rowId)) {
          setSelectedCell();
        }
      } else if (selectedColumns.length) {
        const newColumns = columns.filter(column => !selectedColumns.includes(column.field));
        const newRows = rows.map(row =>
          Object.keys(row)
            .filter(key => !selectedColumns.includes(key))
            .reduce((prevSum, key) => ({ ...prevSum, [key]: row[key] }), {}),
        );
        saveToHistory(newRows, newColumns);
        setColumns(newColumns);
        setRows(newRows);
        if (selectedColumns.includes(selectedCell?.columnField)) {
          setSelectedCell();
        }
      }
      setOpenWarningAlert(false);
    };

    const cancelDelete = () => {
      setOpenWarningAlert(false);
    };

    useImperativeHandle(ref, () => ({
      undo: () => {
        if (historyIndex > 0) {
          const previousState = history[historyIndex - 1];
          if (!previousState.columns.find(column => column.field == selectedCell?.columnField)) {
            setSelectedCell();
          } else if (!previousState.rows.find(row => row.id == selectedCell?.rowId)) {
            setSelectedCell(prev => ({
              ...(prev || {}),
              rowId: undefined,
            }));
          }

          setRows(previousState.rows);
          setColumns(previousState.columns);
          setHistoryIndex(historyIndex - 1);
          onCanUndo?.(historyIndex - 1 > 0);
          onCanRedo?.(true);
        }
      },
      redo,
      addRow,
      addColumn,
      resetTable: ({ headers: newHeaders, rows: newRows }) => {
        const newColumns = newHeaders.map(header => ({
          field: header,
          headerName: header,
          editable: true, // Make cells editable
        }));
        const newDataRows = newRows.map((row, index) => {
          if (Array.isArray(row)) {
            const cells = row.map(cell => cell.trim() || '');
            const rowData = { id: index + 1 }; // Add a unique ID for each row
            newHeaders.forEach((header, i) => {
              rowData[header] = cells[i] || ''; // Map headers to cell values
            });
            return rowData;
          } else {
            return row;
          }
        });
        saveToHistory(newDataRows, newColumns);
        setColumns(newColumns);
        setRows(newDataRows);
      },
      delete: () => {
        if (rowSelectionModel.length || selectedColumns.length) {
          setOpenWarningAlert(true);
        }
      },
      getCode: () => convertToMarkdown(columns, rows),
    }));

    useEffect(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      // Set a new timeout to update Formik's state after a delay
      const timeout = setTimeout(() => {
        onChange?.(convertToMarkdown(columns, rows));
      }, 30);
      setDebounceTimeout(timeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns, rows]);

    const {
      tableRef,
      onClickDownloadWithMonitor: onClickDownload,
      onClick,
    } = useDownloadTable({
      tableRowData: convertToMarkdown(columns, rows),
      interaction_uuid,
      conversation_uuid,
    });

    useEffect(() => {
      setTimeout(() => {
        if (tableId) {
          const table = document.getElementById(tableId);
          if (table) {
            tableRef.current = table;
          }
        }
      }, 30);
    }, [tableId, tableRef]);

    const [paginationModel, setPaginationModel] = useState({
      pageSize: 50,
      page: 0,
    });

    const onColumnVisibilityModelChange = useCallback(newModel => {
      setColumnVisibilityModel(newModel);
    }, []);

    const handleCellEditStart = useCallback((params, event) => {
      // Prevent editing when typing a character
      if (event.key && event.key.length === 1) {
        event.defaultMuiPrevented = true;
      }
    }, []);

    useEffect(() => {
      onRowsColumnsSelected({
        hasSelectedRows: !!rowSelectionModel.length,
        hasSelectedColumns: !!selectedColumns.length,
      });
    }, [onRowsColumnsSelected, rowSelectionModel.length, selectedColumns.length]);

    return (
      <>
        <Box sx={styles.tableContainer}>
          <DataGrid
            rows={rows}
            columns={[
              {
                ...GRID_CHECKBOX_SELECTION_COL_DEF,
                hideable: false,
              },
              ...[...columns]
                .filter(col => col)
                .map(col => ({
                  ...col,
                  sortable: true,
                  hideable: visibleColumnsCount === 1 && columnVisibilityModel[col.field] ? false : undefined,
                  // width: 300,
                  minWidth: 160,
                  flex: 1,
                  renderCell: params => <ExpandableCell {...params} />,
                  renderEditCell: params => (
                    <CellEditor
                      {...params}
                      rows={rows}
                      readOnly={readOnly}
                    />
                  ),
                  renderHeader: params => (
                    <ColumnHeader
                      handleHeaderChangeRef={handleHeaderChangeRef}
                      rows={rows}
                      setRows={setRows}
                      setSortModel={setSortModel}
                      sortModel={sortModel}
                      readOnly={readOnly}
                      {...params}
                    />
                  ),
                  headerClassName: selectedColumns.includes(col.field)
                    ? 'MuiDataGrid-columnHeader--selected'
                    : undefined,
                })),
            ]}
            sx={styles.dataGrid}
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 200}
            columnThreshold={0}
            processRowUpdate={handleProcessRowUpdate}
            experimentalFeatures={{ newEditingApi: true }}
            showCellVerticalBorder
            showColumnVerticalBorder
            // disableColumnResize
            pageSizeOptions={[5, 10, 50, 100]}
            // paginationMode='server'
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            onCellClick={onCellClick}
            onColumnHeaderClick={onColumnHeaderClick}
            getCellClassName={getCellClassName}
            getColumnHeaderClassName={getColumnHeaderClassName}
            checkboxSelection={!readOnly && !!rows.length}
            disableRowSelectionOnClick={!readOnly}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={onRowSelectionModelChange}
            disableColumnSorting
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={onColumnVisibilityModelChange}
            onCellEditStart={handleCellEditStart} // Customize keyboard behavior
          />
          <Box sx={styles.downloadButtonContainer}>
            <SplitButton
              defaultValue="xlsx"
              options={downloadTableOptions}
              onClick={interaction_uuid ? onClickDownload : onClick}
            />
          </Box>
        </Box>
        {tableId && (
          <Box display={'none'}>
            <Markdown tableId={tableId}>{convertToMarkdown(columns, rows)}</Markdown>
          </Box>
        )}
        <AlertDialog
          title="Warning"
          alertContent={`Are you sure to delete the selected ${rowSelectionModel.length ? 'rows' : 'columns'}`}
          open={openWarningAlert}
          alarm
          onClose={cancelDelete}
          onCancel={cancelDelete}
          onConfirm={onConfirmDelete}
        />
      </>
    );
  },
);

// Component styles
const componentStyles = theme => ({
  expandableCellTypography: {
    whiteSpaceCollapse: 'preserve', // prevent white spaces being collapsed
  },
  expandableCellLink: {
    fontSize: 'inherit',
    letterSpacing: 'inherit',
  },
  columnHeaderSortButton: {
    marginLeft: '0px',
    marginRight: '8px',
    transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    '& svg path': {
      fill: theme.palette.icon.fill.default,
    },
  },
  columnHeaderSortButtonActive: {
    '& svg path': {
      fill: undefined,
    },
  },
  columnHeaderTextField: {
    paddingTop: '0px !important',
    marginTop: '8px',
    '& .MuiInputBase-root': {
      '& input': {
        typography: 'labelSmall', // Apply Typography variant to the input text
        color: theme.palette.text.default,
      },
    },
  },
  columnHeaderTextFieldInput: {
    disableUnderline: true,
    sx: {
      typography: 'labelSmall',
    },
  },
  columnHeaderTextFieldHtmlInput: {
    sx: {
      typography: 'labelSmall',
    },
  },
  tableContainer: {
    maxHeight: 'calc(100vh - 80px)',
    height: 'calc(100vh - 80px)',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
    gap: '8px',
  },
  dataGrid: {
    [`& .${gridClasses.cell}`]: {
      py: 1,
    },
    [`& .${gridClasses.cellEmpty}`]: {
      display: 'none',
    },
    '& .MuiDataGrid-columnHeaderTitleContainerContent': {
      flex: 1,
    },
    '& .MuiDataGrid-columnSeparator': {
      height: '100% !important', // Full height
    },
    '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
      py: 1,
    },
    '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
      padding: '12px',
    },
    '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
      py: '22px',
    },
    ['& .MuiDataGrid-iconButtonContainer']: {
      display: 'none',
    },
    '& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer .MuiDataGrid-columnHeaderTitleContainerContent':
      {
        width: '100%',
        justifyContent: 'center',
        background: theme.palette.background.default,
      },
    '& .MuiDataGrid-cellCheckbox': {
      position: 'sticky',
      left: 0,
      zIndex: 1,
      background: theme.palette.background.default,
    },
    '& .MuiDataGrid-columnHeaderCheckbox': {
      position: 'sticky',
      left: 0,
      zIndex: 1,
    },
    '& .MuiDataGrid-cell--selected': {
      backgroundColor: theme.palette.background.dataGrid.row.selected, // Highlight selected cells
    },
    '& .MuiDataGrid-columnHeader--selected': {
      backgroundColor: theme.palette.background.dataGrid.row.selected, // Highlight selected column headers
    },
  },
  downloadButtonContainer: {
    width: '100%',
    height: '30px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: '2px',
  },
});

MarkdownTableEditor.displayName = 'MarkdownTableEditor';

export default MarkdownTableEditor;
