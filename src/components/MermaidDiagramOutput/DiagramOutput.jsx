import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import domtoimage from 'dom-to-image';
import mermaid from 'mermaid';
import svgPanZoom from 'svg-pan-zoom';

import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import FullscreenIcon from '@/assets/full-screen-icon.svg?react';
import MinusIcon from '@/assets/minus-icon.svg?react';
import { HEIGHTS, ICON_SIZES, WIDTHS } from '@/common/designTokens';
import { useTheme } from '@emotion/react';

import DotMenu from '../DotMenu';
import DownloadIcon from '../Icons/DownloadIcon';
import InfoIcon from '../Icons/InfoIcon';
import PlusIcon from '../Icons/PlusIcon';
import './DiagramOutput.css';

let diagramCount = 0;

const getDiagramId = () => {
  const diagramId = `diagram_${diagramCount}`;
  const graphId = `diagram_graph_${diagramCount}`;
  diagramCount++;
  return {
    diagramId,
    graphId,
  };
};

// Helper function to create user-friendly Mermaid error messages
const createUserFriendlyErrorMessage = error => {
  if (!error) return 'Unknown diagram error occurred';

  const errorStr = error.toString?.() || String(error);

  // Extract line number if available
  const lineMatch = errorStr.match(/line (\d+)/i);
  const lineNumber = lineMatch ? lineMatch[1] : null;

  // Extract the problematic code snippet with improved patterns
  let problematicCode = null;

  // Pattern 1: "line X: ...code... --------> Expecting..." (most common)
  let codeMatch = errorStr.match(/line \d+:\s*(.+?)\s*-{5,}>\s*Expecting/i);
  if (codeMatch && codeMatch[1]) {
    problematicCode = codeMatch[1].trim();
  } else {
    // Pattern 2: "line X: ...code... Expecting..." (without arrows)
    codeMatch = errorStr.match(/line \d+:\s*(.+?)\s*Expecting/i);
    if (codeMatch && codeMatch[1]) {
      problematicCode = codeMatch[1].trim();
    } else {
      // Pattern 3: Extract everything after "line X:" until newline or end
      codeMatch = errorStr.match(/line \d+:\s*(.+?)(?:\n|$)/i);
      if (codeMatch && codeMatch[1]) {
        problematicCode = codeMatch[1].trim();
        // Clean up common parsing artifacts
        problematicCode = problematicCode.replace(/\s*-{5,}>\s*.*$/i, '').trim();
        problematicCode = problematicCode.replace(/\s*Expecting.*$/i, '').trim();
      }
    }
  }

  // Additional cleanup for edge cases
  if (problematicCode) {
    // Remove any remaining "got 'XXX'" patterns
    problematicCode = problematicCode.replace(/\s*,?\s*got\s+['"][^'"]*['"].*$/i, '').trim();
    // Remove trailing punctuation artifacts
    problematicCode = problematicCode.replace(/[,;]\s*$/, '').trim();
  }

  // Common Mermaid error patterns and their user-friendly messages
  const errorPatterns = [
    {
      pattern: /expecting 'semi'|expecting 'newline'|expecting 'eof'/i,
      message: 'Syntax error: Missing semicolon, new line, or unexpected characters',
      hint: 'Check for typos, missing punctuation, or extra characters at the end of lines',
    },
    {
      pattern: /expecting 'start_link'|expecting 'link'/i,
      message: 'Link syntax error: Invalid arrow or connection format',
      hint: 'Use proper arrow syntax like "-->" or "--->" for connections between nodes',
    },
    {
      pattern: /expecting 'vertex'|expecting 'id'/i,
      message: 'Node definition error: Invalid node name or ID',
      hint: 'Node names should not contain special characters. Use alphanumeric characters and underscores',
    },
    {
      pattern: /lexical error/i,
      message: 'Invalid character or symbol detected',
      hint: 'Remove any unsupported special characters or check for typing errors',
    },
    {
      pattern: /parse error/i,
      message: 'Diagram structure error',
      hint: 'Check the overall diagram syntax and ensure proper flowchart/graph declaration',
    },
  ];

  // Find matching pattern
  const matchedPattern = errorPatterns.find(p => p.pattern.test(errorStr));

  if (matchedPattern) {
    let message = `${matchedPattern.message}`;
    if (lineNumber) {
      message += ` (Line ${lineNumber})`;
    }

    // Add problematic code if found
    if (problematicCode) {
      message += `\n\n❌ Problematic code: **${problematicCode}**`;
    }

    message += `\n\nTip: ${matchedPattern.hint}`;
    return message;
  }

  // Fallback for unrecognized errors
  let fallbackMessage = 'Diagram syntax error detected';
  if (lineNumber) {
    fallbackMessage += ` on line ${lineNumber}`;
  }

  // Add problematic code if found
  if (problematicCode) {
    fallbackMessage += `\n\n❌ Problematic code: **${problematicCode}**`;
  }

  fallbackMessage +=
    '\n\nTip: Check your diagram syntax against Mermaid documentation. Common issues include missing arrows, invalid node names, or incorrect diagram type declaration.';

  return fallbackMessage;
};

const MermaidDiagramOutput = ({ code, onQuickFix, isQuickFixLoading = false, quickFixTooltip = '' }) => {
  // console.log('MermaidDiagramOutput=====>', code)
  const panZoomTigerRef = useRef(null);
  const theme = useTheme();
  const [hasBeenChanged, setHasBeenChanged] = useState(false);
  const { diagramId, graphId } = useMemo(() => getDiagramId(), []);
  const [isValidCode, setIsValidCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rawErrorMessage, setRawErrorMessage] = useState('');

  const createExportDiagram = useCallback(async () => {
    const canvas = document.createElement('div');
    canvas.id = 'saveImageCanvas';
    // Apply styles to the div
    canvas.style.backgroundColor = theme.palette.background.tabPanel;
    canvas.style.width = 'auto';
    canvas.style.padding = '20px';
    canvas.style.height = 'auto';
    canvas.style.display = 'flex';
    canvas.style.justifyContent = 'center';
    canvas.style.alignItems = 'center';
    document.body.appendChild(canvas);
    const { svg } = await mermaid.render('save_diagram_graph_id', code, canvas);
    canvas.innerHTML = svg;
    return { canvas, imageId: '#saveImageCanvas' };
  }, [code, theme.palette.background.tabPanel]);

  const menuItems = useMemo(() => {
    return [
      {
        label: 'JPG',
        icon: <DownloadIcon sx={{ fontSize: '1rem' }} />,
        onClick: async () => {
          const { canvas, imageId } = await createExportDiagram();
          if (canvas) {
            try {
              domtoimage.toJpeg(document.querySelector(imageId), { quality: 100 }).then(dataUrl => {
                const link = document.createElement('a');
                link.download = 'diagram.jpg';
                link.href = dataUrl;
                link.click();
                canvas.remove();
              });
            } catch {
              // Export failed silently
            }
          }
        },
      },
      {
        label: 'PNG',
        icon: <DownloadIcon sx={{ fontSize: '1rem' }} />,
        onClick: async () => {
          const { canvas, imageId } = await createExportDiagram();
          if (canvas) {
            try {
              domtoimage.toPng(document.querySelector(imageId)).then(dataUrl => {
                const link = document.createElement('a');
                link.download = 'diagram.png';
                link.href = dataUrl;
                link.click();
                canvas.remove();
              });
            } catch {
              // Export failed silently
            }
          }
        },
      },
      {
        label: 'SVG',
        icon: <DownloadIcon sx={{ fontSize: '1rem' }} />,
        onClick: async () => {
          const { canvas, imageId } = await createExportDiagram();
          if (canvas) {
            try {
              const svgData = new XMLSerializer().serializeToString(document.querySelector(imageId));
              const blob = new Blob([svgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);

              const link = document.createElement('a');
              link.href = url;
              link.download = 'diagram.svg';
              link.click();
              canvas.remove();
            } catch {
              // Export failed silently
            }
          }
        },
      },
    ];
  }, [createExportDiagram]);

  const onZoomOut = useCallback(() => {
    if (panZoomTigerRef.current) {
      panZoomTigerRef.current.zoomOut();
    }
  }, []);

  const onZoomIn = useCallback(() => {
    if (panZoomTigerRef.current) {
      panZoomTigerRef.current.zoomIn();
    }
  }, []);

  const onReset = useCallback(() => {
    if (panZoomTigerRef.current) {
      panZoomTigerRef.current.reset();
      setHasBeenChanged(false);
    }
  }, []);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: 'loose',
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
    });
    mermaid.contentLoaded();
  }, [theme.palette.mode]);

  useEffect(() => {
    const renderDiagram = async () => {
      const diagram = document.getElementById(diagramId);
      let noError = true;
      if (diagram) {
        diagram.style.height = '100%';
        diagram.style.width = '100%';
        try {
          const { svg } = await mermaid.render(graphId, code, diagram);
          diagram.innerHTML = svg;
        } catch (err) {
          // console.log('mermaid render error ======>', err)
          noError = false;
          setRawErrorMessage(err?.stack || err?.message || String(err));
          setErrorMessage(createUserFriendlyErrorMessage(err));
        }
        if (noError) {
          setErrorMessage('');
          setRawErrorMessage('');
          const svgElement = document.querySelector(`#${graphId}`);
          if (svgElement) {
            svgElement.style.height = '100%';
            svgElement.style.width = '100%';
            svgElement.style.maxWidth = 'none !important';

            // Ensure the SVG has a valid viewBox
            if (!svgElement.hasAttribute('viewBox')) {
              const width = svgElement.getAttribute('width') || 1000;
              const height = svgElement.getAttribute('height') || 1000;
              svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
            }

            if (panZoomTigerRef.current) {
              panZoomTigerRef.current.destroy();
              panZoomTigerRef.current = null;
            }
            panZoomTigerRef.current = svgPanZoom(svgElement, {
              zoomScaleSensitivity: 0.1,
              center: true,
              minZoom: 0.1,
            });
            panZoomTigerRef.current.resetPan();
            panZoomTigerRef.current.resetZoom();
            panZoomTigerRef.current.zoom(1);
            panZoomTigerRef.current.setBeforePan(() => {
              setHasBeenChanged(true);
            });
            panZoomTigerRef.current.setBeforeZoom(() => {
              setHasBeenChanged(true);
            });
          }
        }
      }
    };
    if (code) {
      renderDiagram();
    } else {
      const diagram = document.getElementById(diagramId);
      if (diagram) {
        diagram.innerHTML = '';
      }
      setIsValidCode(false);
    }
    return () => {
      // Cleanup: Destroy panZoom instance and clear diagram container
      if (panZoomTigerRef.current) {
        panZoomTigerRef.current.destroy();
        panZoomTigerRef.current = null;
      }
      const diagram = document.getElementById(diagramId);
      if (diagram) {
        diagram.innerHTML = '';
      }
    };
  }, [code, diagramId, graphId]);

  useEffect(() => {
    setErrorMessage('');
    setRawErrorMessage('');
  }, [code]);

  const handleQuickFix = useCallback(() => {
    onQuickFix?.({
      error: rawErrorMessage || errorMessage,
      code,
    });
  }, [code, errorMessage, onQuickFix, rawErrorMessage]);

  useEffect(() => {
    const parseCode = async () => {
      if (await mermaid.parse(code, { suppressErrors: true })) {
        setIsValidCode(true);
      } else {
        setIsValidCode(false);
      }
    };
    parseCode();
  }, [code]);

  // Apply custom styling for Mermaid error images
  useEffect(() => {
    const styleId = 'mermaid-error-image-style';

    // Remove existing style if present
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create and inject CSS for smaller error images
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Target all possible Mermaid error elements */
      .mermaid img,
      .mermaid svg image,
      .mermaid svg g image {
        max-width: ${ICON_SIZES.ERROR_IMAGE} !important;
        max-height: ${ICON_SIZES.ERROR_IMAGE} !important;
        width: ${ICON_SIZES.ERROR_IMAGE} !important;
        height: ${ICON_SIZES.ERROR_IMAGE} !important;
      }
      
      /* When mermaid has error, limit the entire SVG size */
      .mermaid svg:has(image),
      .mermaid svg:has(g image),
      .mermaid-error svg {
        max-width: ${WIDTHS.errorContainer} !important;
        max-height: ${HEIGHTS.errorContainer} !important;
        width: ${WIDTHS.errorContainer} !important;
        height: ${HEIGHTS.errorContainer} !important;
      }
      
      /* Force error container alignment */
      .mermaid-error {
        max-width: ${WIDTHS.errorContainer} !important;
        max-height: ${HEIGHTS.errorContainer} !important;
        display: flex !important;
        justify-content: flex-start !important;
        align-items: flex-start !important;
        text-align: left !important;
      }
      
      /* Fix text color for mermaid error text using theme colors */
      .mermaid-error svg text,
      .mermaid-error text {
        fill: ${theme.palette.text.primary} !important;
        color: ${theme.palette.text.primary} !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [theme.palette.text.primary]);

  return (
    <Box
      width={'100%'}
      display={'flex'}
      flexDirection={'column'}
      padding="0px 0px 0px 0px"
      gap="12px"
      height={'100%'}
      boxSizing={'border-box'}
      position={'relative'}
    >
      <Box
        display={'flex'}
        flexDirection={'row'}
        height={'auto'}
        justifyContent={'flex-end'}
        alignItems={'center'}
        position={'absolute'}
        top="12px"
        right={'12px'}
        gap={'8px'}
      >
        {errorMessage && onQuickFix && (
          <Tooltip
            title={quickFixTooltip}
            placement="bottom"
          >
            <span>
              <IconButton
                onClick={handleQuickFix}
                disabled={isQuickFixLoading}
                disableRipple
                sx={({ palette }) => ({
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  height: '1.75rem',
                  paddingLeft: '0.75rem',
                  paddingRight: '0.75rem',
                  color: palette.split.text.default,
                  background: palette.split.default,
                  borderRadius: '1.5rem',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: palette.split.hover,
                  },
                  '&:active': {
                    color: palette.split.text.pressed,
                    backgroundColor: palette.split.pressed,
                  },
                  '&:disabled': {
                    color: palette.split.text.disabled,
                    backgroundColor: palette.split.disabled,
                  },
                })}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: ({ palette }) => palette.text.createButton,
                  }}
                >
                  {isQuickFixLoading ? (
                    <CircularProgress
                      size={16}
                      color="inherit"
                    />
                  ) : (
                    <AutoFixHighIcon fontSize="small" />
                  )}
                </Box>
                <Typography
                  sx={({ typography }) => ({
                    color: 'inherit',
                    fontFamily: typography.fontFamily,
                    fontFeatureSettings: typography.fontFeatureSettings,
                  })}
                  variant="labelSmall"
                >
                  {isQuickFixLoading ? 'Fixing...' : 'Quick Fix'}
                </Typography>
              </IconButton>
            </span>
          </Tooltip>
        )}
        <DotMenu
          id="conversation-menu"
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          disabled={!isValidCode}
          iconColor="secondary"
          menuIcon={
            <DownloadIcon
              sx={{ fontSize: '16px', marginTop: '-1px' }}
              fill={isValidCode ? theme.palette.icon.fill.default : theme.palette.icon.fill.disabled}
            />
          }
        >
          {menuItems}
        </DotMenu>
      </Box>
      <Box
        display={'flex'}
        flexDirection={'column'}
        height={'auto'}
        justifyContent={'flex-end'}
        alignItems={'flex-end'}
        position={'absolute'}
        bottom="12px"
        left={'12px'}
        borderRadius={'2px'}
        border={`1px solid ${theme.palette.border.lines}`}
      >
        <IconButton
          variant="alita"
          color="tertiary"
          sx={{
            marginLeft: '0px',
            borderRadius: '0px',
            borderBottom: `1px solid ${theme.palette.border.lines}`,
          }}
          onClick={onZoomIn}
        >
          <PlusIcon
            sx={{ fontSize: '16px' }}
            fill={theme.palette.icon.fill.default}
          />
        </IconButton>
        <IconButton
          variant="alita"
          color="tertiary"
          sx={{
            marginLeft: '0px',
            borderRadius: '0px',
            borderBottom: `1px solid ${theme.palette.border.lines}`,
          }}
          onClick={onZoomOut}
        >
          <MinusIcon
            sx={{ fontSize: '16px' }}
            fill={theme.palette.icon.fill.default}
          />
        </IconButton>
        <IconButton
          disabled={!hasBeenChanged}
          variant="alita"
          color="tertiary"
          sx={{ marginLeft: '0px', borderRadius: '0px' }}
          onClick={onReset}
        >
          <FullscreenIcon
            sx={{ fontSize: '16px' }}
            fill={theme.palette.icon.fill.secondary}
          />
        </IconButton>
      </Box>
      <Box
        height={'100%'}
        width={'100%'}
        maxWidth={'100%'}
        border={`1px solid ${theme.palette.border.lines} `}
        borderRadius={'8px'}
        display={'flex'}
        flexDirection="column"
        justifyContent={'flex-start'}
        alignItems={'center'}
        boxSizing={'border-box'}
        overflow={'scroll'}
        backgroundColor={theme.palette.background.tabPanel}
      >
        {errorMessage && (
          <Box
            width={'100%'}
            marginTop={'8px'}
            marginBottom={'8px'}
            padding="8px"
            flexWrap={'wrap'}
          >
            <Typography
              variant="labelMedium"
              color="error"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.2 }}
            >
              {(() => {
                const message = errorMessage?.toString() || '';
                const parts = message.split(/(\*\*.*?\*\*)/g);

                return parts.map((part, index) => {
                  if (part === '**TIP_ICON**') {
                    return (
                      <InfoIcon
                        key={index}
                        sx={{
                          fontSize: '16px',
                          verticalAlign: 'text-bottom',
                          marginRight: '4px',
                          color: theme.palette.info.main,
                        }}
                      />
                    );
                  } else if (part.startsWith('**') && part.endsWith('**')) {
                    const boldText = part.slice(2, -2);
                    return (
                      <Typography
                        key={index}
                        component="span"
                        variant="labelMedium"
                        sx={{
                          fontWeight: 'bold',
                          backgroundColor:
                            theme.palette.background.errorCodeHighlight || theme.palette.action.hover,
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {boldText}
                      </Typography>
                    );
                  }
                  return part;
                });
              })()}
            </Typography>
          </Box>
        )}
        <div
          id={diagramId}
          className={`mermaid ${errorMessage ? 'mermaid-error' : ''}`}
          style={{
            width: '100% !important',
            height: '100% !important',
            marginTop: '0px',
            padding: '4px',
            ...(errorMessage
              ? {
                  maxWidth: WIDTHS.errorContainer,
                  maxHeight: HEIGHTS.errorContainer,
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  margin: '0',
                  marginTop: '8px',
                }
              : {}),
          }}
        />
      </Box>
    </Box>
  );
};

export default MermaidDiagramOutput;
