import React, { forwardRef, useMemo } from 'react';

import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { FilePreviewCanvasConstants } from '@/[fsd]/features/artifacts/lib/constants';
import { PreviewDocument } from '@/[fsd]/features/artifacts/ui/';
import { Field } from '@/[fsd]/shared/ui';
import Markdown from '@/components/Markdown';
import MermaidDiagramOutput from '@/components/MermaidDiagramOutput/DiagramOutput';

const PreviewTypeEnum = {
  MARKDOWN: 'MARKDOWN',
  DATA: 'DATA',
  MERMAID: 'MERMAID',
  IMAGE: 'IMAGE',
  CODE: 'CODE',
  DOCX: 'DOCX',
};

const PreviewContent = forwardRef((props, documentReaderRef) => {
  const {
    isLoading,
    isRenderLoading,
    loadError,
    isMarkdownFile,
    renderMode,
    fileContent,
    isDataFile,
    parsedData,
    dataFileType,
    codeMirrorExtension,
    isMermaidFile,
    isImageFileType,
    isDocxFile,
    imageBlobUrl,
    file,
    documentBuffer,
    docxResetKey,
    handleImageError,
    onContentChange,
    canEdit,
  } = props;

  const styles = previewContentStyles();

  const previewType = useMemo(() => {
    const isRenderMode = renderMode === FilePreviewCanvasConstants.RenderModeOptionsEnum.RENDERED;

    if (isMarkdownFile && isRenderMode) return PreviewTypeEnum.MARKDOWN;
    if (isDataFile && isRenderMode) return PreviewTypeEnum.DATA;
    if (isMermaidFile && isRenderMode) return PreviewTypeEnum.MERMAID;
    if (isImageFileType) return PreviewTypeEnum.IMAGE;
    if (isDocxFile) return PreviewTypeEnum.DOCX;

    return PreviewTypeEnum.CODE;
  }, [renderMode, isMarkdownFile, isDataFile, isMermaidFile, isImageFileType, isDocxFile]);

  if (isLoading || isRenderLoading)
    return (
      <Box sx={styles.loaderWrapper}>
        <CircularProgress
          size={32}
          sx={styles.circularProgress}
        />
        <Typography
          variant="bodySmall"
          sx={styles.loadingMessage}
        >
          {'Loading file content...'}
        </Typography>
      </Box>
    );

  if (loadError)
    return (
      <Box sx={styles.errorWrapper}>
        <Typography
          variant="bodyMedium"
          sx={styles.errorTitle}
        >
          Failed to Load File
        </Typography>
        <Typography
          variant="bodySmall"
          sx={styles.loadingMessage}
        >
          {loadError}
        </Typography>
      </Box>
    );

  return (
    <Box sx={styles.contentWrapper}>
      {(() => {
        switch (previewType) {
          case PreviewTypeEnum.MARKDOWN:
            return (
              <Box sx={styles.markdownWrapper}>
                <Markdown>{fileContent}</Markdown>
              </Box>
            );

          case PreviewTypeEnum.DATA:
            return (
              <Box sx={styles.dataFileWrapper}>
                {parsedData && parsedData.headers.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={styles.dataTableContainer}
                  >
                    <Table
                      size="small"
                      stickyHeader
                    >
                      <TableHead>
                        <TableRow>
                          {parsedData.headers.map((header, index) => (
                            <TableCell
                              key={index}
                              sx={[
                                styles.dataTableCellHeader,
                                ({ palette }) => ({
                                  borderRight:
                                    index < parsedData.headers.length - 1
                                      ? `.0625rem solid ${palette.border.lines}`
                                      : 'none',
                                }),
                              ]}
                            >
                              {header || `Column ${index + 1}`}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parsedData.rows.map((row, rowIndex) => (
                          <TableRow
                            key={rowIndex}
                            sx={styles.dataTableRow}
                          >
                            {parsedData.headers.map((_, cellIndex) => (
                              <TableCell
                                key={cellIndex}
                                sx={[
                                  styles.dataTableCellBody,
                                  ({ palette }) => ({
                                    borderRight:
                                      cellIndex < parsedData.headers.length - 1
                                        ? `1px solid ${palette.border.lines}`
                                        : 'none',
                                  }),
                                ]}
                                title={row[cellIndex] || ''}
                              >
                                {row[cellIndex] || ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={styles.noDataWrapper}>
                    <Typography
                      variant="bodyMedium"
                      sx={styles.noDataMessage}
                    >
                      No data to display
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      sx={({ palette }) => ({
                        color: palette.text.tertiary,
                      })}
                    >
                      The {dataFileType?.toUpperCase()} file appears to be empty or has no valid data rows.
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          case PreviewTypeEnum.MERMAID:
            return (
              <Box sx={styles.mermaidWrapper}>
                {fileContent && fileContent.trim() ? (
                  <Box sx={styles.diagramContent}>
                    <MermaidDiagramOutput code={fileContent} />
                  </Box>
                ) : (
                  <Box sx={styles.noDiagramWrapper}>
                    <Typography
                      variant="bodyMedium"
                      sx={styles.noDiagramTitle}
                    >
                      No diagram to display
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      sx={styles.noDiagramDescription}
                    >
                      The Mermaid file appears to be empty or contains invalid syntax.
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          case PreviewTypeEnum.IMAGE:
            return (
              <Box sx={styles.imageWrapper}>
                {fileContent && imageBlobUrl ? (
                  <Box
                    component="img"
                    src={imageBlobUrl}
                    alt={file.name}
                    sx={styles.image}
                    onError={handleImageError}
                  />
                ) : (
                  <Box sx={styles.noImageWrapper}>
                    <Typography
                      variant="bodyMedium"
                      sx={styles.noImageTitle}
                    >
                      No image to display
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      sx={styles.noImageDescription}
                    >
                      The image file appears to be empty or corrupted.
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          case PreviewTypeEnum.DOCX:
            return (
              <PreviewDocument
                key={docxResetKey}
                ref={documentReaderRef}
                documentBuffer={documentBuffer}
                onChange={onContentChange}
              />
            );
          default:
            return (
              <Box sx={styles.codeEditorWrapper}>
                <Field.CodeMirrorEditor
                  autoHeight
                  readOnly={!canEdit}
                  value={fileContent}
                  extensions={codeMirrorExtension}
                  maxHeight="none"
                  variant="caption"
                  width="100%"
                  notifyChange={canEdit ? onContentChange : undefined}
                />
              </Box>
            );
        }
      })()}
    </Box>
  );
});

PreviewContent.displayName = 'PreviewContent';

/** @type {MuiSx} */
const previewContentStyles = () => ({
  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 1,
    marginTop: 5,
  },

  circularProgress: ({ palette }) => ({ color: palette.primary.main }),

  loadingMessage: ({ palette }) => ({ color: palette.text.tertiary }),

  errorWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 3,
    textAlign: 'center',
  },

  errorTitle: ({ palette }) => ({
    color: palette.text.attention,
    marginBottom: 1,
    fontWeight: 500,
  }),

  contentWrapper: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  markdownWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '.75rem 1rem',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',

    table: {
      minWidth: 'unset !important',
    },

    '&::-webkit-scrollbar': {
      width: '.25rem',
    },

    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },

    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '.125rem',
    },

    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },

    '& p': {
      color: palette.text.secondary,
      lineHeight: 1.5,
      marginBottom: '0.8em',
      fontSize: '.8125rem',
    },

    '& pre': {
      backgroundColor: palette.background.tabPanel,
      border: `.0625rem solid ${palette.border.lines}`,
      borderRadius: '.25rem',
      padding: '.5rem',
      overflow: 'auto',
      marginBottom: '0.8em',
      fontSize: '.75rem',
    },

    '& code': {
      backgroundColor: palette.background.tabPanel,
      padding: '.0625rem .1875rem',
      borderRadius: '.125rem',
      fontSize: '.6875rem',
      color: palette.text.primary,
    },

    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
    },

    '& table': {
      borderCollapse: 'collapse',
      marginBottom: '0.8em',
      width: '100%',
      fontSize: '.75rem',
    },

    '& th, & td': {
      border: `.0625rem solid ${palette.border.lines}`,
      padding: '.375rem .5rem',
      textAlign: 'left',
    },

    '& th': {
      backgroundColor: palette.background.tabPanel,
      fontWeight: 'bold',
      color: palette.text.primary,
    },

    '& td': {
      color: palette.text.secondary,
    },

    '& ul, & ol': {
      color: palette.text.secondary,
      paddingLeft: '1.5em',
      marginBottom: '0.8em',
      fontSize: '.8125rem',
    },

    '& li': {
      marginBottom: '0.2em',
    },

    '& blockquote': {
      borderLeft: `.1875rem solid ${palette.primary.main}`,
      marginLeft: 0,
      paddingLeft: '0.8em',
      color: palette.text.tertiary,
      fontStyle: 'italic',
    },

    '& a': {
      color: palette.primary.main,
      textDecoration: 'none',

      '&:hover': {
        textDecoration: 'underline',
      },
    },
  }),

  dataFileWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '.75rem 1rem',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',

    table: {
      minWidth: 'unset !important',
    },

    '&::-webkit-scrollbar': {
      width: '.25rem',
      height: '.25rem',
    },

    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },

    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '.125rem',
    },

    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },
  }),

  dataTableContainer: ({ palette }) => ({
    backgroundColor: 'transparent',
    boxShadow: 'none',
    border: `.0625rem solid ${palette.border.lines}`,
    borderRadius: '.25rem',
    overflow: 'auto',
  }),

  dataTableCellHeader: ({ palette }) => ({
    backgroundColor: palette.background.tabPanel,
    color: palette.text.primary,
    fontWeight: 600,
    fontSize: '.75rem',
    padding: '.5rem .75rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    whiteSpace: 'nowrap',
    minWidth: '6.25rem',
  }),

  dataTableRow: ({ palette }) => ({
    '&:nth-of-type(odd)': {
      backgroundColor: palette.background.secondary,
    },

    '&:nth-of-type(even)': {
      backgroundColor: palette.background.tabPanel,
    },

    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),

  dataTableCellBody: ({ palette }) => ({
    color: palette.text.secondary,
    fontSize: '.6875rem',
    padding: '.375rem .75rem',
    borderBottom: `.0625rem solid ${palette.border.lines}`,
    maxWidth: '12.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),

  noDataWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },

  noDataMessage: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: 1,
  }),

  mermaidWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    padding: '.75rem 1rem',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    '&::-webkit-scrollbar': {
      width: '.25rem',
      height: '.25rem',
    },
    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },
    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '.125rem',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },
  }),

  diagramContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '12.5rem',
    width: '100%',
  },

  noDiagramWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },

  noDiagramTitle: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: 1,
  }),

  noDiagramDescription: ({ palette }) => ({
    color: palette.text.tertiary,
  }),

  imageWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '.75rem 1rem',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',

    '&::-webkit-scrollbar': {
      width: '.25rem',
      height: '.25rem',
    },

    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },

    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '.125rem',
    },

    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },
  }),

  image: {
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
    borderRadius: '.25rem',
    boxShadow: '0 .125rem .5rem rgba(0, 0, 0, 0.1)',
  },

  noImageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
  },

  noImageTitle: ({ palette }) => ({
    color: palette.text.secondary,
    marginBottom: 1,
  }),

  noImageDescription: ({ palette }) => ({
    color: palette.text.tertiary,
  }),

  codeEditorWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.background.secondary,
    overflowY: 'auto',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',

    '&::-webkit-scrollbar': {
      width: '.25rem',
      height: '.25rem',
    },

    '&::-webkit-scrollbar-track': {
      background: palette.background.tabPanel,
    },

    '&::-webkit-scrollbar-thumb': {
      background: palette.border.lines,
      borderRadius: '.125rem',
    },

    '&::-webkit-scrollbar-thumb:hover': {
      background: palette.text.tertiary,
    },

    '& .cm-editor': {
      height: 'auto !important',
      minHeight: '100%',
      maxHeight: 'none !important',
    },

    '& .cm-scroller': {
      overflow: 'visible !important',
      maxHeight: 'none !important',
    },

    '& .cm-content': {
      minHeight: 'auto',
      padding: '.75rem',
    },

    '& .cm-focused': {
      outline: 'none',
    },
  }),
});

export default PreviewContent;
