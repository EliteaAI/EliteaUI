import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import Menu from '@mui/material/Menu';

import { AUTO_MODEL_ID } from '@/[fsd]/shared/lib/constants/autoRouting.constants';
import { compareModels } from '@/[fsd]/widgets/llm-model-selector/lib';

import ModelRow from './ModelRow';

const LLMModelsMenu = memo(props => {
  const { anchorEl, onClose, models = [], selectedModel, onSelectModel, menuProps = {} } = props;

  const open = Boolean(anchorEl);

  const sortedModels = useMemo(() => {
    const autoIndex = models.findIndex(m => m.id === AUTO_MODEL_ID);
    const nonAuto = models.filter(m => m.id !== AUTO_MODEL_ID);
    nonAuto.sort(compareModels);
    return autoIndex !== -1 ? [models[autoIndex], ...nonAuto] : nonAuto;
  }, [models]);

  const menuListRef = useRef(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef(null);
  const modelsRef = useRef(sortedModels);
  modelsRef.current = sortedModels;

  const anchorOrigin = menuProps.anchorOrigin ?? { vertical: 'top', horizontal: 'right' };
  const transformOrigin = menuProps.transformOrigin ?? { vertical: 'bottom', horizontal: 'right' };
  const paperSx = menuProps.paperSx ?? {};

  const handleSelectModel = useCallback(
    model => {
      onSelectModel(model);
      onClose();
    },
    [onSelectModel, onClose],
  );

  // document-level capture listener: registered on open, removed on close.
  // Using document (not the ul ref) avoids MUI portal timing: the ref is checked
  // inside the handler where the menu is guaranteed to be fully mounted.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = e => {
      const listEl = menuListRef.current;
      if (!listEl) return;

      // Focus may be on the MUI Paper container (not inside the ul) when the menu
      // first opens — MUI's focus trap puts focus on the Paper. We still handle
      // navigation; currentIndex will be -1 and ArrowDown will land on item 0.
      const activeEl = document.activeElement;
      const options = Array.from(listEl.children).filter(el => el.getAttribute('aria-disabled') !== 'true');
      const activeLi = options.find(el => el === activeEl || el.contains(activeEl));
      const currentIndex = activeLi ? options.indexOf(activeLi) : -1;

      const focusOption = target => {
        target?.focus();
        target?.scrollIntoView({ block: 'nearest' });
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        focusOption(options[currentIndex < options.length - 1 ? currentIndex + 1 : 0]);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        focusOption(options[currentIndex > 0 ? currentIndex - 1 : options.length - 1]);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        focusOption(options[0]);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        focusOption(options[options.length - 1]);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.stopPropagation();
        clearTimeout(typeaheadTimerRef.current);
        const prevQuery = typeaheadRef.current;
        typeaheadRef.current += e.key.toLowerCase();
        typeaheadTimerRef.current = setTimeout(() => {
          typeaheadRef.current = '';
        }, 800);
        const query = typeaheadRef.current;
        const currentModels = modelsRef.current;

        // Detect repeated single-char (e.g. "ggg") — cycle through all matches for that char.
        const isCycle = query.split('').every(c => c === query[0]);
        let match;
        if (isCycle && prevQuery) {
          // Cycle: find the next match after the currently focused item.
          const char = query[0];
          const matches = currentModels.filter(m =>
            (m.display_name || m.name).toLowerCase().startsWith(char),
          );
          if (matches.length) {
            const focusedIndex = currentIndex >= 0 ? currentModels.indexOf(currentModels[currentIndex]) : -1;
            const focusedMatchIndex = matches.findIndex(m => currentModels.indexOf(m) === focusedIndex);
            match = matches[(focusedMatchIndex + 1) % matches.length];
          }
        } else {
          // Accumulate: prefer startsWith, fall back to includes.
          match =
            currentModels.find(m => (m.display_name || m.name).toLowerCase().startsWith(query)) ??
            currentModels.find(m => (m.display_name || m.name).toLowerCase().includes(query));
        }

        if (match) {
          const target = options[currentModels.indexOf(match)];
          target?.focus();
          target?.scrollIntoView({ block: 'nearest' });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const listEl = menuListRef.current;
      if (!listEl) return;
      const selected = listEl.querySelector('[aria-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
        selected.focus();
      }
    });
  }, [open]);

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        list: {
          ref: menuListRef,
          role: 'listbox',
          'aria-labelledby': 'model-selector-button',
          sx: styles.menuList,
        },
        paper: {
          sx: [styles.menuPaper, paperSx],
        },
      }}
    >
      {sortedModels.map((item, index) => (
        <ModelRow
          key={item.id ?? index}
          model={item}
          isSelected={item.id === selectedModel?.id}
          isFirstRow={index === 0}
          onClick={() => handleSelectModel(item)}
        />
      ))}
    </Menu>
  );
});

LLMModelsMenu.displayName = 'LLMModelsMenu';

/** @type {MuiSx} */
const styles = {
  menuPaper: {
    marginTop: '-0.25rem',
    width: '24rem',
    overflow: 'hidden',
  },
  menuList: ({ palette }) => ({
    padding: '0.25rem 0',
    maxHeight: '22.25rem',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: `${palette.border.lines} transparent`,
    '&::-webkit-scrollbar': { width: '0.375rem' },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: palette.border.lines,
      borderRadius: '0.375rem',
    },
  }),
};

export default LLMModelsMenu;
