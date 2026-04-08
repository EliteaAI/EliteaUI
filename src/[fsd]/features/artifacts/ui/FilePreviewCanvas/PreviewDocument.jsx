import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';

import { Box, GlobalStyles } from '@mui/material';

import { DocxEditor } from '@eigenpal/docx-js-editor';
import '@eigenpal/docx-js-editor/styles.css';

const PreviewDocument = forwardRef((props, ref) => {
  const { documentBuffer, onChange, onError, onFontsLoaded } = props;

  const docxEditorRef = useRef(null);

  const styles = previewDocumentStyles();

  useImperativeHandle(ref, () => ({
    getFileBlob: async () => {
      const buffer = await docxEditorRef.current.save();

      let blob = null;
      if (buffer)
        blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      return blob;
    },
  }));

  return (
    <Box sx={styles.docxEditorWrapper}>
      <GlobalStyles styles={styles.customDropDown} />
      <DocxEditor
        showToolbar
        showRuler
        showZoomControl
        ref={docxEditorRef}
        documentBuffer={documentBuffer}
        onChange={onChange}
        onError={onError}
        onFontsLoaded={onFontsLoaded}
        showPageNumbers={false}
        initialZoom={0.75}
      />
    </Box>
  );
});

PreviewDocument.displayName = 'PreviewDocument';

/** @type {MuiSx} */
const previewDocumentStyles = () => ({
  customDropDown: ({ palette }) => ({
    'div[role="listbox"]': {
      backgroundColor: `${palette.background.tabPanel} !important`,

      div: {
        color: `${palette.text.secondary} !important`,

        '>div': {
          backgroundColor: `${palette.background.tabPanel} !important`,

          span: {
            color: `${palette.text.secondary} !important`,
          },

          '&:hover': {
            backgroundColor: `${palette.background.secondary} !important`,
          },
        },
      },
      p: { color: 'red !important' },
    },
  }),
  docxEditorWrapper: ({ palette }) => ({
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.background.secondary,

    '& .docx-editor': {
      height: '100%',
      backgroundColor: palette.background.secondary,
    },

    '& .docx-editor > div': {
      backgroundColor: palette.background.secondary,
    },

    // // Toolbar styling — compact & themed
    '& .sticky': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: `${palette.background.tabPanel} !important`,
      borderBottom: `0.0625rem solid ${palette.border.lines}`,
      boxShadow: 'none !important',
      flexWrap: 'wrap',
      maxHeight: '5rem',
      overflowY: 'hidden',
      overflowX: 'auto',
      gap: '0 !important',
      padding: '0.125rem 0.5rem',

      '>div': {
        background: `${palette.background.tabPanel} !important`,

        '>div': {
          background: `${palette.background.tabPanel} !important`,

          '>div': {
            background: `${palette.background.tabPanel} !important`,
          },
        },

        '&:first-of-type': {
          '>div': {
            '&:nth-child(1)': {
              display: 'none',
            },
            '&:nth-child(8)': {
              display: 'none',
            },

            '>div': {
              '&:not(.items-center)': {
                border: `1px solid ${palette.border.lines} !important`,
              },
            },
          },
        },
      },

      '&::-webkit-scrollbar': {
        width: '.1875rem',
        height: '.1875rem',
      },
      '&::-webkit-scrollbar-track': {
        background: palette.background.tabPanel,
      },
      '&::-webkit-scrollbar-thumb': {
        background: palette.border.lines,
        borderRadius: '.125rem',
      },
    },

    // Table insert popover (grid picker submenu)
    '& div:has(> div > [role="grid"][aria-label="Table size selector"])': {
      background: `${palette.background.tabPanel} !important`,
      border: `1px solid ${palette.border.lines} !important`,

      '>div': {
        '>div': {
          '>div': {
            background: `${palette.background.tabPanel} !important`,
            border: `1px solid ${palette.border.lines} !important`,
          },
        },
      },
      // "Select size" label text
      '& > div > div:last-child:not([role="grid"])': {
        color: `${palette.text.secondary} !important`,
      },

      '& [role="gridcell"][aria-selected="true"]': {
        backgroundColor: `${palette.background.button.primary.pressed} !important`,
        borderColor: `${palette.background.secondary} !important`,
      },
    },

    // Toolbar buttons
    '& .sticky button': {
      borderRadius: '0.25rem',
      minWidth: 'unset',
      padding: '0.125rem 0.25rem',
      fontSize: '0.75rem',
      fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
      fontWeight: 400,
      lineHeight: '1rem',
      boxShadow: 'none !important',
      outline: 'none !important',
      color: `${palette.text.secondary} !important`,

      '&:not([role="gridcell"]):not([aria-pressed="true"])': {
        background: `${palette.background.tabPanel} !important`,

        '&:hover': {
          background: `${palette.background.secondary} !important`,
        },
      },
    },

    // Toolbar button borders
    ['& .sticky button[aria-label="Undo"],' +
    '& .sticky button[aria-label="Redo"],' +
    '& .sticky button[aria-label="Bold"],' +
    '& .sticky button[aria-label="Italic"],' +
    '& .sticky button[aria-label="Underline"],' +
    '& .sticky button[aria-label="Strikethrough"],' +
    '& .sticky button[aria-label="Font size"],' +
    '& .sticky button[aria-label="Decrease font size"],' +
    '& .sticky button[aria-label="Increase font size"],' +
    '& .sticky button[aria-label="Insert link"],' +
    '& .sticky button[aria-label="Superscript"],' +
    '& .sticky button[aria-label="Subscript"],' +
    '& .sticky button[aria-label="Center (Ctrl + E)"],' +
    '& .sticky button[data-testid="toolbar-alignment"]']: {
      border: `1px solid ${palette.border.lines} !important`,
    },

    '& .sticky button[aria-label="Clear formatting"]': {
      display: 'none',
    },

    ['& .sticky button[aria-pressed="true"]']: {
      background: `${palette.background.button.primary.pressed} !important`,
    },

    '& .sticky button[aria-label="Font size"]': {
      pointerEvents: 'none',
    },

    '& .sticky button[role="combobox"]': {
      border: `1px solid ${palette.border.lines} !important`,
    },

    '.docx-list-buttons': {
      borderRadius: '0.25rem',
      height: '2rem',
    },

    '.docx-color-picker-dropdown': {
      backgroundColor: `${palette.background.tabPanel} !important`,
      border: `1px solid ${palette.border.lines} !important`,

      '>div': {
        '&:last-of-type': {
          display: 'none',
        },
      },
    },

    '.docx-color-picker': {
      borderRadius: '0.25rem',
      backgroundColor: `${palette.background.tabPanel} !important`,

      button: {
        '&:not([role="gridcell"])': {
          padding: '0 !important',
          height: '1.875rem !important',
        },

        '&[role="gridcell"]': {
          '&:not([aria-selected="true"])': {
            border: 'none !important',
          },
        },
      },
    },

    '.docx-hyperlink-dialog': {
      backgroundColor: `${palette.background.secondary} !important`,

      '.docx-hyperlink-dialog-header': {
        borderBottom: `1px solid ${palette.border.lines} !important`,
      },

      '.docx-hyperlink-dialog-footer': {
        alignItems: 'center',
        borderTop: `1px solid ${palette.border.lines} !important`,
      },

      '.docx-hyperlink-dialog-cancel': {
        height: '1.75rem !important',
        color: `${palette.text.secondary} !important`,
        borderRadius: '1.75rem !important',
        background: `${palette.background.button.secondary.default} !important`,
        border: `none !important`,
        padding: '0.375rem 1rem !important',
        minWidth: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },

      '.docx-hyperlink-dialog-submit': {
        height: '1.75rem !important',
        color: `${palette.text.button.primary} !important`,
        borderRadius: '1.75rem !important',
        background: `${palette.background.button.primary.default} !important`,
        padding: '0.375rem 1rem !important',
        minWidth: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        '&:disabled': {
          background: `${palette.background.button.primary.disabled} !important`,
          color: `${palette.text.button.primary} !important`,
        },
      },

      input: {
        background: palette.background.tabPanel,
        border: `1px solid ${palette.background.tabPanel} !important`,

        color: `${palette.text.secondary} !important`,
      },

      'h2, label': {
        color: `${palette.text.secondary} !important`,
      },
    },

    // Tooltip text color
    '& .fixed.z-50.text-white.bg-slate-900': {
      color: `${palette.text.secondary} !important`,
    },

    '.docx-outline-nav': {
      display: 'none !important',
    },

    '.docx-vertical-ruler': {
      marginTop: '6.25rem !important',
    },

    '.docx-vertical-ruler, .paged-editor, .paged-editor__pages': {
      background: `${palette.background.tabPanel} !important`,
    },

    '.layout-page': {
      backgroundColor:
        palette.mode === 'dark'
          ? `${palette.text.input.disabled} !important`
          : `${palette.background.paper} !important`,
    },
  }),
});

export default memo(PreviewDocument);
