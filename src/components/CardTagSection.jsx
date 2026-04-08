import { memo, useCallback, useMemo, useRef } from 'react';

import { Box } from '@mui/material';

import CardPopover from '@/components/CardPopover';
import CardTagSectionItem from '@/components/CardTagSectionItem';
import useTags from '@/hooks/useTags';

const MAX_NUMBER_TAGS_SHOWN = 2;

const CardTagSection = memo(props => {
  const {
    tags,
    allTags,
    extraTagsCount,
    disableClickTags = false,
    dynamic = false,
    customTagClickHandler,
  } = props;

  const tagLength = useMemo(() => tags?.length, [tags]);
  const cardPopoverRef = useRef(null);
  const { handleClickTag } = useTags();
  const styles = tagSectionStyles();

  const handleTagClick = useCallback(
    tag => e => {
      if (customTagClickHandler) {
        customTagClickHandler(e, tag);
      } else {
        handleClickTag(e, tag);
      }
    },
    [handleClickTag, customTagClickHandler],
  );

  const handleTagNumberClick = useCallback(event => {
    cardPopoverRef.current.handleClick(event);
  }, []);

  return (
    <Box
      sx={styles.section}
      color="text.secondary"
    >
      {tags?.map((tag, index) => {
        if (!dynamic && index > MAX_NUMBER_TAGS_SHOWN - 1) return null;

        const tagName = tag?.name;
        const tagId = tag?.id || index;
        return (
          <CardTagSectionItem
            key={tagId}
            text={tagName}
            hoverHighlight
            paddingLeft={!!index}
            showDivider={index !== tagLength - 1 && (dynamic || index !== MAX_NUMBER_TAGS_SHOWN - 1)}
            onClick={disableClickTags ? null : handleTagClick(tag)}
          />
        );
      })}
      {!dynamic && tagLength + extraTagsCount - MAX_NUMBER_TAGS_SHOWN > 0 ? (
        <Box
          component="span"
          sx={styles.extraTagContainer}
        >
          <CardTagSectionItem
            text={`+${tagLength + extraTagsCount - MAX_NUMBER_TAGS_SHOWN}`}
            showDivider={false}
            onClick={handleTagNumberClick}
          />
        </Box>
      ) : null}
      {dynamic && extraTagsCount ? (
        <Box
          component="span"
          sx={styles.extraTagContainer}
        >
          <CardTagSectionItem
            text={`+${extraTagsCount}`}
            showDivider={false}
            onClick={handleTagNumberClick}
          />
        </Box>
      ) : null}
      <CardPopover
        ref={cardPopoverRef}
        contentList={allTags}
        type={'category'}
      />
    </Box>
  );
});
CardTagSection.displayName = 'CardTagSection';

/** @type {MuiSx} */
const tagSectionStyles = () => ({
  section: {
    display: 'flex',
    height: '1.75rem', // 28px
    padding: 0,
  },
  extraTagContainer: ({ palette }) => ({
    '& span:hover': {
      color: palette.text.secondary,
    },
  }),
});

export default CardTagSection;
