import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Box, ClickAwayListener, Link, Paper, Popper, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { Button, Input } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import InfoIcon from '@/components/Icons/InfoIcon';

import { WHOLE_TEAM_ID } from '../../lib/constants/shareChat.constants';
import {
  WHOLE_TEAM_ITEM,
  addPicked,
  countPeopleWithAccess,
  getWholeTeamName,
  hasWholeTeam,
  togglePick,
} from '../../lib/helpers/shareChat.helpers';
import ShareAccessRow from './ShareAccessRow';
import ShareInviteDialog from './ShareInviteDialog';

const OPTIONS_MAX_HEIGHT = 280;
const MIN_OPTIONS_HEIGHT = 120;
const DROPDOWN_FOOTER_PX = 58;
const DROPDOWN_GAP_PX = 12;

const ShareTeamTab = memo(props => {
  const {
    owner,
    list,
    members,
    membersTotal,
    query,
    membersFetched,
    membersQueryTotal,
    isMembersFetching,
    onLoadMoreMembers,
    onQueryChange,
    onChangeList,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const searchRef = useRef(null);
  const [dropdownBox, setDropdownBox] = useState({ width: 0, optionsMaxHeight: OPTIONS_MAX_HEIGHT });

  useLayoutEffect(() => {
    if (!isOpen || !searchRef.current) return;
    const search = searchRef.current.getBoundingClientRect();
    const body = searchRef.current.closest('.MuiDialogContent-root')?.getBoundingClientRect();
    const room =
      (body ? body.bottom : window.innerHeight) - search.bottom - DROPDOWN_GAP_PX - DROPDOWN_FOOTER_PX;
    setDropdownBox({
      width: search.width,
      optionsMaxHeight: Math.max(MIN_OPTIONS_HEIGHT, Math.min(OPTIONS_MAX_HEIGHT, room)),
    });
  }, [isOpen]);

  const listIds = useMemo(() => new Set(list.map(item => item.id)), [list]);
  const isWholeTeamAdded = hasWholeTeam(list);
  const accessCount = countPeopleWithAccess(list, membersTotal);
  const wholeTeamName = getWholeTeamName(membersTotal);

  // The server filters members by the search; Whole team shows only with an empty search
  const candidates = useMemo(() => {
    const people = members.filter(member => !listIds.has(member.id));
    return query.trim() ? people : [WHOLE_TEAM_ITEM, ...people];
  }, [members, listIds, query]);

  const alreadyAdded = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return null;
    return list.find(item => item.id !== WHOLE_TEAM_ID && item.name.toLowerCase() === text) ?? null;
  }, [list, query]);

  const message = useMemo(() => {
    if (isWholeTeamAdded) return 'Everyone already has access';
    if (isMembersFetching && !candidates.length) return null;
    if (alreadyAdded && !candidates.length) return `${alreadyAdded.name} already has access`;
    if (!candidates.length) return 'No matches found';
    return null;
  }, [isWholeTeamAdded, isMembersFetching, alreadyAdded, candidates.length]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setPicked([]);
  }, []);

  const handleOpen = useCallback(() => setIsOpen(true), []);

  const handleQueryChange = useCallback(
    value => {
      onQueryChange(value);
      setIsOpen(true);
    },
    [onQueryChange],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeDropdown();
      }
    },
    [closeDropdown],
  );

  const handleTogglePick = useCallback(item => setPicked(prev => togglePick(prev, item)), []);

  const handleAdd = useCallback(() => {
    onChangeList(addPicked(list, picked));
    onQueryChange('');
    closeDropdown();
  }, [onChangeList, onQueryChange, list, picked, closeDropdown]);

  const handleRemove = useCallback(
    id => onChangeList(list.filter(item => item.id !== id)),
    [list, onChangeList],
  );

  const handleRemoveAll = useCallback(() => onChangeList([]), [onChangeList]);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const handleInvite = useCallback(() => setIsInviteOpen(true), []);
  const closeInvite = useCallback(() => setIsInviteOpen(false), []);

  const styles = shareTeamTabStyles();

  return (
    <Box sx={styles.root}>
      <ClickAwayListener onClickAway={closeDropdown}>
        <Box
          ref={searchRef}
          sx={styles.searchWrap}
          onKeyDown={handleKeyDown}
        >
          <Input.SimpleSearchBar
            data-testid="share-search"
            autoFocus={false}
            isActive={isOpen}
            searchQuery={query}
            onSearchChange={handleQueryChange}
            onFocus={handleOpen}
            placeholder="Add people from the team project"
          />
          <Popper
            open={isOpen}
            anchorEl={searchRef.current}
            placement="bottom-start"
            modifiers={POPPER_MODIFIERS}
            popperOptions={POPPER_OPTIONS}
            disablePortal
            sx={styles.popper}
          >
            <Paper
              data-testid="share-dropdown"
              elevation={8}
              sx={styles.dropdown}
              style={{ width: dropdownBox.width }}
            >
              {message ? (
                <Box sx={styles.messageBlock}>
                  <Box sx={styles.messageLine}>
                    <InfoIcon sx={styles.infoIcon} />
                    <Typography
                      variant="bodyMedium"
                      color="text.secondary"
                    >
                      {message}
                    </Typography>
                  </Box>
                  <Typography
                    variant="bodyMedium"
                    color="text.primary"
                  >
                    Not in the project?{' '}
                    <Link
                      component="button"
                      type="button"
                      underline="none"
                      sx={styles.inviteLink}
                      onClick={handleInvite}
                    >
                      Invite to project
                    </Link>
                  </Typography>
                </Box>
              ) : (
                <Box
                  role="listbox"
                  sx={styles.options}
                  style={{ maxHeight: dropdownBox.optionsMaxHeight }}
                >
                  {candidates.map(item => (
                    <ShareAccessRow
                      key={item.id}
                      testId="share-dropdown-row"
                      item={item}
                      wholeTeamName={wholeTeamName}
                      selected={picked.some(entry => entry.id === item.id)}
                      onSelect={handleTogglePick}
                    />
                  ))}
                  <ListInfiniteMoreLoader
                    listCurrentSize={membersFetched}
                    totalAvailableCount={membersQueryTotal}
                    onLoadMore={onLoadMoreMembers}
                    isLoading={isMembersFetching}
                    resetPageDependencies={query}
                  />
                </Box>
              )}
              <Box sx={styles.dropdownFooter}>
                <Typography
                  data-testid="share-selected-count"
                  variant="bodyMedium"
                  color="text.primary"
                >
                  {`${picked.length} selected`}
                </Typography>
                <Button.BaseBtn
                  data-testid="share-add"
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.primary}
                  disabled={!picked.length}
                  onClick={handleAdd}
                >
                  Add
                </Button.BaseBtn>
              </Box>
            </Paper>
          </Popper>
        </Box>
      </ClickAwayListener>

      <Box sx={styles.listHeader}>
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          People with access – {accessCount}
        </Typography>
        {list.length > 0 && (
          <Button.BaseBtn
            data-testid="share-remove-all"
            variant={BUTTON_VARIANTS.auxiliary}
            sx={styles.removeAll}
            onClick={handleRemoveAll}
          >
            Remove access for all
          </Button.BaseBtn>
        )}
      </Box>

      <Box
        data-testid="share-access-list"
        sx={styles.list}
      >
        <ShareAccessRow
          item={owner}
          isOwner
        />
        {list.map(item => (
          <ShareAccessRow
            key={item.id}
            item={item}
            wholeTeamName={wholeTeamName}
            removable
            onRemove={handleRemove}
          />
        ))}
      </Box>
      {isInviteOpen && <ShareInviteDialog onClose={closeInvite} />}
    </Box>
  );
});

ShareTeamTab.displayName = 'ShareTeamTab';

const POPPER_MODIFIERS = [{ name: 'offset', options: { offset: [0, 4] } }];
// Fixed, so the dropdown leaves the scrolling body but stays inside the click-away area
const POPPER_OPTIONS = { strategy: 'fixed' };

/** @type {MuiSx} */
const shareTeamTabStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  popper: ({ zIndex }) => ({
    zIndex: zIndex.modal + 1,
  }),
  searchWrap: {
    position: 'relative',
  },
  dropdown: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.default.secondary,
    overflow: 'hidden',
  }),
  options: {
    overflowY: 'auto',
    padding: '0.25rem 0',
  },
  messageBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    padding: '1rem',
  },
  messageLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  infoIcon: {
    fontSize: '1rem',
  },
  inviteLink: ({ palette }) => ({
    color: palette.components.button.text.showMore,
    '&:hover': { color: palette.components.button.text.auxiliary },
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    lineHeight: 'inherit',
    verticalAlign: 'baseline',
  }),
  dropdownFooter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 1rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  // The Auxiliary variant is 12 px; the window's text buttons are 14 px
  removeAll: {
    fontSize: '0.875rem',
    fontWeight: 500,
    minWidth: 0,
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0.5rem',
  },
  list: ({ palette }) => ({
    backgroundColor: palette.background.default.tertiary,
    flex: '1 1 0',
    minHeight: '5rem',
    overflowY: 'auto',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    padding: '0.25rem 0',
  }),
});

export default ShareTeamTab;
