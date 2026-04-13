import { memo, useCallback, useEffect, useState } from 'react';

import { Box, Collapse, useTheme } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';
import FolderIcon from '@/components/Icons/FolderIcon';

/**
 * Recursive tree item component for displaying files and folders
 */
const FileTreeItem = memo(props => {
  const {
    item,
    bucket,
    depth = 0,
    onSelectFile,
    onSelectFolder,
    selectedFile,
    selectedBucketName,
    currentPrefix,
    expandedPaths = [],
    nextItem = null,
    hoveredItemKey = null,
    onHoverChange,
    isNextSiblingHighlighted = false,
  } = props;

  const theme = useTheme();
  const [isHovering, setIsHovering] = useState(false);
  const shouldAutoExpand = !item.isFile && expandedPaths.includes(item.key);
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  // Auto-expand when expandedPaths changes (e.g., when loading from URL)
  useEffect(() => {
    if (shouldAutoExpand && !isExpanded) {
      setIsExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoExpand]);

  // Check if this item is active: either it's the selected file, or it's the folder matching currentPrefix
  const isFileActive = selectedFile?.key === item.key && selectedBucketName === bucket?.name;
  const isFolderActive =
    !item.isFile && currentPrefix === item.key && selectedBucketName === bucket?.name && !selectedFile;
  const isActive = isFileActive || isFolderActive;
  const hasChildren = !item.isFile && item.children?.length > 0;
  const nextItemHovered = nextItem && hoveredItemKey === nextItem.key;

  // Check if folder's first child is hovered (for expanded folders)
  const firstChild = hasChildren ? item.children[0] : null;
  const firstChildHovered = isExpanded && firstChild && hoveredItemKey === firstChild.key;

  // Helper to check if an item is selected (file or folder)
  const isItemSelected = itemKey => {
    if (!itemKey || selectedBucketName !== bucket?.name) return false;
    if (selectedFile?.key === itemKey) return true;
    if (!selectedFile && currentPrefix === itemKey) return true;
    return false;
  };

  // Check if next item or first child is selected (for hiding border when next item is active)
  const nextItemSelected = nextItem && isItemSelected(nextItem.key);
  const firstChildSelected = isExpanded && firstChild && isItemSelected(firstChild.key);

  // Determine if this item's next sibling (or the external next element) is highlighted,
  // so the last child of this item can also hide its border across boundaries.
  const propagateHighlightToLastChild =
    nextItemHovered || nextItemSelected || (!nextItem && isNextSiblingHighlighted);

  const styles = fileTreeItemStyles({
    isActive,
    isHovering,
    depth,
    theme,
    nextItemHovered:
      nextItemHovered ||
      firstChildHovered ||
      nextItemSelected ||
      firstChildSelected ||
      (!nextItem && isNextSiblingHighlighted),
  });

  const handleSelect = useCallback(() => {
    if (item.isFile) {
      onSelectFile?.(item, bucket);
    } else {
      setIsExpanded(prev => !prev);
      // Also notify parent about folder selection for table navigation
      onSelectFolder?.(item.key, bucket);
    }
  }, [item, bucket, onSelectFile, onSelectFolder]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    onHoverChange?.(item.key, true);
  }, [item.key, onHoverChange]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    onHoverChange?.(item.key, false);
  }, [item.key, onHoverChange]);

  return (
    <Box sx={styles.wrapper}>
      <Box
        sx={styles.container}
        onClick={handleSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Box sx={styles.contentArea}>
          {!item.isFile && <FolderIcon sx={styles.folderIcon} />}

          <Tooltip.TypographyWithConditionalTooltip
            title={item.name}
            placement="top"
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.itemName}
          >
            {item.name}
          </Tooltip.TypographyWithConditionalTooltip>
        </Box>
      </Box>

      {/* Children (for folders) */}
      {hasChildren && (
        <Collapse
          in={isExpanded}
          unmountOnExit
        >
          <Box sx={styles.childrenContainer}>
            {item.children.map((child, index) => (
              <FileTreeItem
                key={child.key}
                item={child}
                bucket={bucket}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                onSelectFolder={onSelectFolder}
                selectedFile={selectedFile}
                selectedBucketName={selectedBucketName}
                currentPrefix={currentPrefix}
                expandedPaths={expandedPaths}
                nextItem={item.children[index + 1] || null}
                hoveredItemKey={hoveredItemKey}
                onHoverChange={onHoverChange}
                isNextSiblingHighlighted={
                  index === item.children.length - 1 ? propagateHighlightToLastChild : false
                }
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
});

FileTreeItem.displayName = 'FileTreeItem';

/** @type {MuiSx} */
const fileTreeItemStyles = ({ isActive, isHovering, depth, theme, nextItemHovered }) => {
  const getBackgroundColor = () => {
    if (isActive) return theme.palette.background.conversation.selected;
    if (isHovering) return theme.palette.background.conversation.hover;
    return theme.palette.background.conversation.normal;
  };

  const isHighlighted = isActive || isHovering;
  const indentPadding = 0.5 + depth * 1.5; // Base padding + depth-based indent (fixed indentation per level)

  return {
    wrapper: {
      width: '100%',
      minWidth: `${indentPadding + 5}rem`,
    },

    container: {
      paddingLeft: `${indentPadding}rem`,
      gap: '0.5rem',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: '2rem',
      position: 'relative',
      cursor: 'pointer',
    },

    contentArea: {
      width: 'calc(100% + 1rem)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      overflow: 'hidden',
      marginLeft: '-1rem',
      paddingLeft: '1rem',
      paddingTop: '0.375rem',
      paddingBottom: '0.375rem',
      marginRight: '-3rem',
      paddingRight: '0.5rem',
      background: getBackgroundColor(),
      borderRadius: isHighlighted ? '0.375rem' : '0',
      borderBottom:
        !isHighlighted && !nextItemHovered
          ? `0.0625rem solid ${theme.palette.border.conversationItemDivider}`
          : 'none',
    },

    folderIcon: {
      width: '1rem',
      height: '1rem',
      color: theme.palette.icon.fill.secondary,
      flexShrink: 0,
    },

    itemName: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      fontSize: '0.75rem',
      flex: 1,
    },

    childrenContainer: {
      width: '100%',
    },
  };
};

export default FileTreeItem;
