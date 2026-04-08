import * as React from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { debounce } from '@/common/utils';
import { actions as tagsActions } from '@/slices/tags';

import { calculateOneTagWidthOnCard } from './useTags';

// recalculate card width after CARD_WIDTH_RECALCULATE_INTERVAL while resizing
const CARD_WIDTH_RECALCULATE_INTERVAL = 100;

const useCardResize = (cardRef, notFirstCard = 0) => {
  const [cardWidth, setCardWidth] = React.useState(0);
  const { currentCardWidth, tagWidthOnCard } = useSelector(state => state.tags);
  // const dispatch = useDispatch();

  // 5. use Redux data of tags and their width to compare with sum of the input tags' width.
  // if input tags' width reach the target width, it will stop and return:
  //   a. processedTags: processed tag list for rendering
  //   b. extraTagsCount: tag counts which won't be shown(due to remaining space not enough) on card
  const processTagsByCurrentCardWidth = React.useCallback(
    (tags = [], proportion = 0.6) => {
      let targetIndex = 0;
      let widthSum = 0;
      let extraTagsCount = tags.length;
      const maxWidth = currentCardWidth * proportion;
      const sortedTagsByNameLength = [...tags].sort((tag1, tag2) => {
        const tag1Length = tag1?.name.length || 0;
        const tag2Length = tag2?.name.length || 0;
        return tag1Length - tag2Length;
      });

      sortedTagsByNameLength.some((tag, index) => {
        const tagWidth = tagWidthOnCard[tag.name];
        widthSum += tagWidth;
        if (widthSum > maxWidth) {
          return true;
        }
        targetIndex = index + 1;
      });
      extraTagsCount = extraTagsCount - targetIndex;

      let processedTags = sortedTagsByNameLength.slice(0, targetIndex);
      if (tags.length && !processedTags.length) {
        // If there are input tags but no processed tags, we need to handle this case, because the first tag is too long
        const processedFirstTag = calculateOneTagWidthOnCard(tags[0], maxWidth);
        processedTags = [
          {
            ...tags[0],
            name: processedFirstTag.name,
          },
        ];
      }

      return {
        processedTags,
        extraTagsCount,
      };
    },
    [currentCardWidth, tagWidthOnCard],
  );

  const dispatch = useDispatch();

  // 4. update card's width to Redux
  const updateCardWidth = React.useCallback(() => {
    dispatch(
      tagsActions.updateCardWidth({
        cardWidth,
      }),
    );
  }, [cardWidth, dispatch]);

  // 3. calculate the card's width everytime after 'onResizeEnd'
  const calculateCardWidth = React.useCallback(() => {
    const _cardWidth = cardRef.current.getBoundingClientRect().width;
    setCardWidth(Math.round(_cardWidth));
  }, [cardRef]);

  // 2. deboundce for inplementing the 'onResizeEnd'
  const handleCardResize = debounce(() => {
    calculateCardWidth();
  }, CARD_WIDTH_RECALCULATE_INTERVAL);

  // 1. register the handleCardResize for card width's calculation everytime resize end
  React.useEffect(() => {
    if (notFirstCard) return;
    calculateCardWidth();
    window.addEventListener('resize', handleCardResize);
    return () => {
      window.removeEventListener('resize', handleCardResize);
    };
  }, [calculateCardWidth, notFirstCard, handleCardResize]);

  React.useEffect(() => {
    if (cardWidth) updateCardWidth();
  }, [cardWidth, updateCardWidth]);

  return {
    processTagsByCurrentCardWidth,
  };
};

export default useCardResize;
