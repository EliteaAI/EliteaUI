import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

export const eliteaDataGridStyle = theme => ({
  ['& .MuiDataGrid']: {
    backgroundColor: 'transparent',
  },
  ['&.MuiDataGrid-withBorderColor']: {
    borderColor: 'transparent',
  },
  ['& .MuiDataGrid-container--top [role=row]']: {
    background: 'transparent',
  },
  ['& .MuiDataGrid-container--bottom [role=row]']: {
    background: 'transparent',
  },
  ['& .MuiDataGrid-columnHeader--sortable']: {
    padding: '0',
  },
  ['& .MuiDataGrid-columnHeader:focus']: {
    outline: 'none',
  },
  ['& .MuiDataGrid-cell:focus']: {
    outline: 'none',
  },
  ['& .MuiDataGrid-columnHeader:focus-within']: {
    outline: 'none',
  },
  ['& .MuiDataGrid-cell:focus-within']: {
    outline: 'none',
  },
  '& .MuiDataGrid-cell': {
    display: 'flex',
    alignItems: 'center',
    borderTop: '0px !important',
    borderBottom: `1px solid ${theme.palette.background.dataGrid.main} !important`,
  },
  ['& .MuiDataGrid-row']: {
    '--rowBorderColor': theme.palette.background.dataGrid.main,
    minHeight: '52px !important',
  },
  ['& .MuiDataGrid-container--top::after']: {
    backgroundColor: theme.palette.background.dataGrid.main,
  },
  ['& .css-tgsonj']: {
    borderTop: '0',
  },
  ['& .MuiDataGrid-footerContainer']: {
    borderTop: '0',
  },
  ['& .MuiDataGrid-iconButtonContainer']: {
    display: 'none',
  },
  ['& .MuiDataGrid-columnHeader--sortable svg']: {
    transition:
      'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, transform 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  },
  ['& .MuiDataGrid-columnHeader--sortable[aria-sort="none"] .MuiSvgIcon-root path']: {
    fill: theme.palette.icon.fill.default,
  },
  ['& .MuiDataGrid-columnHeader--sortable[aria-sort="ascending"] .MuiSvgIcon-root']: {
    transform: 'rotate(180deg)',
  },
  ['& .MuiDataGrid-columnHeader--sortable[aria-sort="descending"] .MuiSvgIcon-root']: {
    transform: 'rotate(0deg)',
  },
  ['& .MuiDataGrid-row--editing .MuiDataGrid-cell']: {
    backgroundColor: theme.palette.background.secondary,
  },
  ['& .MuiDataGrid-row:hover']: {
    backgroundColor: 'transparent',
  },
  ['& .MuiDataGrid-editInputCell input']: {
    padding: '0 10px',
  },
  ['& .MuiDataGrid-row .MuiInput-root::after']: {
    display: 'none',
  },
  ['& .MuiDataGrid-row .MuiInput-root::before']: {
    display: 'none',
  },
  ['& .MuiDataGrid-row .MuiTextField-root textarea']: {
    marginBottom: '0',
  },
  ['& .MuiDataGrid-overlay']: {
    backgroundColor: 'transparent',
  },
});

export const TheStyledDataGrid = styled(DataGrid)(({ theme }) => eliteaDataGridStyle(theme));

export default function StyledDataGrid(props) {
  return <TheStyledDataGrid {...props} />;
}
