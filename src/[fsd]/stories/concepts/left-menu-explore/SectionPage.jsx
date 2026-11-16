// A section's own page, opened from Explore's hover list in the left menu: Agents, Pipelines, Skills, Toolkits &
// Indexes, MCPs, Applications. Owner's decisions 2026-11-10: creation moves to the page's «+» menu; the Catalog becomes
// the Discover mode of the page (Yours / Discover). Cards are the team's EntityCard.
import { memo, useEffect, useRef, useState } from 'react';

import { Formik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { Badge, Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material';

import { useImport } from '@/[fsd]/entities/import-wizard/lib/hooks';
import { AgentsTab } from '@/[fsd]/features/agent-hub/ui';
import { GenerateAgentModal } from '@/[fsd]/features/agent/ui/generate-agent-modal';
import { ApplicationCatalog } from '@/[fsd]/features/apps';
import { AIEditPipelineModal } from '@/[fsd]/features/pipelines/ai-edit-pipeline';
import { PrivateSkillsList } from '@/[fsd]/features/skill';
import { SkillsTab } from '@/[fsd]/features/skill-hub/ui';
import { useSkillImport } from '@/[fsd]/features/skill/lib/hooks';
import { GenerateSkillModal } from '@/[fsd]/features/skill/ui/generate-skill-modal';
import SkillImportModal from '@/[fsd]/features/skill/ui/import/SkillImportModal';
import ToolkitsList from '@/[fsd]/features/toolkits/ui/list/ToolkitsList';
import { Button, Input, Tab } from '@/[fsd]/shared/ui';
import SparkleIcon from '@/assets/ai-sparkle-icon.svg?react';
import AppsIcon from '@/assets/applications-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import ImportIcon from '@/assets/import-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import PlusIcon from '@/assets/plus-icon.svg?react';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import {
  CollectionStatus,
  ContentType,
  PUBLIC_PROJECT_ID,
  SortFields,
  SortOrderOptions,
  URL_PARAMS_KEY_TAGS,
} from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';
import ViewToggle from '@/components/ViewToggle';
import PrivateAgentsList from '@/pages/Applications/PrivateAgentsList';
import PrivatePipelinesList from '@/pages/Pipelines/PrivatePipelinesList';
import { actions as searchActions } from '@/slices/search';

import { CATALOG, CATALOG_SKILLS, customizeSection } from './data';
import { useSectionTab } from './sectionTab';

export const SECTIONS = [
  {
    key: 'agents',
    label: 'Agents',
    one: 'Agent',
    Icon: ApplicationsIcon,
    type: ContentType.ApplicationAll,
    catalog: CATALOG,
  },
  { key: 'pipelines', label: 'Pipelines', one: 'Pipeline', Icon: FlowIcon, type: ContentType.PipelineAll },
  {
    key: 'skills',
    label: 'Skills',
    one: 'Skill',
    Icon: SkillsIcon,
    type: ContentType.SkillAll,
    catalog: CATALOG_SKILLS,
  },
  {
    key: 'toolkits',
    label: 'Toolkits & Indexes',
    one: 'Toolkit',
    Icon: ToolIcon,
    type: ContentType.ToolkitAll,
  },
  { key: 'mcps', label: 'MCPs', one: 'MCP', Icon: MCPIcon, type: ContentType.MCPAll },
  {
    key: 'applications',
    label: 'Applications',
    one: 'Application',
    Icon: AppsIcon,
    type: ContentType.AppAll,
  },
];

const MODES = [
  { value: 'yours', label: 'Yours' },
  { value: 'discover', label: 'Discover' },
];

// Lower-case a label for running text but keep acronyms: "Toolkits & Indexes" → "toolkits & indexes", "MCPs" stays.
const lower = text => text.replace(/\b([A-Z])(?=[a-z])/g, c => c.toLowerCase());

// The team's 1.75rem icon button with a tooltip (IconButton variant="elitea"), tertiary (no fill) as the icons of the
// menu's «Chats» header; the «+» is PlusButton.
const IconAction = ({ label, color = 'tertiary', onClick, disabled, pressed, children }) => (
  <Tooltip
    title={label}
    placement="top"
  >
    <Box component="span">
      <IconButton
        disableRipple
        variant="elitea"
        color={color}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        disabled={disabled}
        sx={color === 'primary' ? styles.addButton : styles.toolIcon}
      >
        {children}
      </IconButton>
    </Box>
  </Tooltip>
);

const Title = ({ children, sub, variant = 'headingMedium' }) => (
  <Box sx={styles.titleBlock}>
    <Typography
      variant={variant}
      component="h1"
      color="text.secondary"
    >
      {children}
    </Typography>
    {sub && (
      <Typography
        variant="bodySmall"
        color="text.primary"
      >
        {sub}
      </Typography>
    )}
  </Box>
);

// Import as an icon (owner 2026-11-12: «импорт был просто иконкой, а не кнопкой»): the same action as the product's
// Import button of that page (ToolbarImportButton: useImport; SkillImportButton: useSkillImport and its modal), shown, as
// there, only when the user has a project other than Public.
const useHasOwnProject = () => {
  const { projects } = useSelector(state => state.settings);
  return Boolean(projects?.filter(({ id }) => id != PUBLIC_PROJECT_ID).length);
};

const ImportIconButton = memo(() => {
  const { openFileDialog } = useImport();
  if (!useHasOwnProject()) return null;
  return (
    <IconAction
      label="Import"
      onClick={openFileDialog}
    >
      <ImportIcon />
    </IconAction>
  );
});
ImportIconButton.displayName = 'ImportIconButton';

const SkillImportIconButton = memo(() => {
  const own = useHasOwnProject();
  const {
    openFileDialog,
    isImporting,
    isModalOpen,
    pendingSkill,
    pendingFileName,
    confirmImport,
    cancelImport,
  } = useSkillImport();
  if (!own) return null;
  return (
    <>
      <IconAction
        label="Import"
        onClick={openFileDialog}
        disabled={isImporting}
      >
        <ImportIcon />
      </IconAction>
      <SkillImportModal
        open={isModalOpen}
        skill={pendingSkill}
        fileName={pendingFileName}
        isImporting={isImporting}
        onClose={cancelImport}
        onConfirm={confirmImport}
      />
    </>
  );
});
SkillImportIconButton.displayName = 'SkillImportIconButton';

// A: tabs on top, as on Claude's Customize page (Skills / Connectors / Plugins + Yours / Discover). Each tab holds the
// product's own list of that kind, as on dev (owner 2026-11-12: «структура не такая, как сейчас на Dev»): cards or
// table (ViewToggle), folders and tags in the product's right column (RightInfoPanel), Import where the page has it.
// The lists read the story's sample answers (data.js ROUTES), so search, tags and the view switch really work.
const SORT = { sortBy: SortFields.CreatedAt, sortOrder: SortOrderOptions.DESC };
const YOURS = {
  agents: <PrivateAgentsList {...SORT} />,
  pipelines: (
    <PrivatePipelinesList
      {...SORT}
      statuses={[CollectionStatus.All]}
    />
  ),
  skills: <PrivateSkillsList cardContentType={ContentType.SkillAll} />,
  toolkits: <ToolkitsList cardContentType={ContentType.ToolkitAll} />,
  mcps: (
    <ToolkitsList
      isMCP
      cardContentType={ContentType.MCPAll}
    />
  ),
  // As the Applications tab of the Apps page (src/[fsd]/pages/apps/Apps.jsx): no folders there, «Types» only.
  applications: (
    <ToolkitsList
      isApplication
      cardContentType={ContentType.AppAll}
      disableEmptyRedirect
      showFolders={false}
    />
  ),
};
// The catalog's own lists: the ELITEA Catalog page for agents and skills, the App Catalog tab of the Apps page.
const DISCOVER = {
  agents: query => <AgentsTab query={query} />,
  skills: query => <SkillsTab query={query} />,
  applications: () => <ApplicationCatalog />,
};
// Discover lists whose catalog has the same kind of right column (CatalogBody: Featured and Categories); it goes behind
// the filter icon too, so Yours and Discover behave alike. The App Catalog has no such column.
const CATALOG_COLUMN = new Set(['agents', 'skills']);

// How many filters are on. Yours: the folder and tags in the address, as the product's column writes them. Discover: the
// catalog keeps its picked categories in its own state, so they are counted from its chips (data-selected), which stay
// mounted while the column is hidden.
const useFilterCount = (listRef, discover) => {
  const [searchParams] = useSearchParams();
  const [picked, setPicked] = useState(0);
  useEffect(() => {
    const box = listRef.current;
    if (!discover || !box) return undefined;
    const count = () => setPicked(box.querySelectorAll('[data-selected="true"]').length);
    count();
    const observer = new MutationObserver(count);
    observer.observe(box, { subtree: true, childList: true, attributeFilter: ['data-selected'] });
    return () => observer.disconnect();
  }, [listRef, discover]);
  if (discover) return picked;
  return searchParams.getAll(URL_PARAMS_KEY_TAGS).length + (searchParams.get('folder') ? 1 : 0);
};

// Import where the kind's own page has it: Agents and Pipelines (ToolbarImportButton), Skills (SkillImportButton).
const IMPORT = {
  agents: <ImportIconButton />,
  pipelines: <ImportIconButton />,
  skills: <SkillImportIconButton />,
};

// The product's folders-and-tags column, closed by default and opened by the filter icon (owner 2026-11-12: «вариант с
// фильтрами, панелькой. Открывающийся, закрывающийся … Filters был просто иконкой»). Open, the icon takes the team's
// filled secondary look; closed with a folder, tags or catalog categories picked, a count on it says the list is filtered
// and by how many filters (a 6 px dot was missed by the screen critic, 2026-11-12).
const FiltersIconButton = memo(({ open, onToggle, count }) => {
  const label = open ? 'Hide filters' : count ? `Filters · ${count} on` : 'Show filters';
  return (
    <IconAction
      label={label}
      color={open ? 'secondary' : 'tertiary'}
      pressed={open}
      onClick={onToggle}
    >
      <Badge
        badgeContent={count}
        invisible={open || !count}
        sx={styles.filterDot}
      >
        <FilterAltOutlinedIcon sx={styles.icon16} />
      </Badge>
    </IconAction>
  );
});
FiltersIconButton.displayName = 'FiltersIconButton';

// The always open search field of the team's list toolbar: 19.5rem (312 px, owner 2026-11-11).
const SearchField = ({ query, onQuery, placeholder, endAdornment }) => (
  <Box sx={styles.search}>
    <Input.SimpleSearchBar
      searchQuery={query}
      onSearchChange={event => onQuery(event?.target?.value ?? event)}
      onSearchClear={() => onQuery('')}
      placeholder={placeholder}
      autoFocus={false}
      endAdornment={endAdornment}
    />
  </Box>
);

// Build with AI where the product creates that kind with AI (Katya 2026-11-12: «у нас же есть возможность создать с
// помощью AI сущность … можно в меню даже всунуть»; owner: «хорошее место»): today it is a button on the create page of
// an agent (CreateAgentForm: GenerateAgentButton), a skill (CreateSkillForm: GenerateSkillButton) and a pipeline
// (EditorPanel in create mode: AIEditPipelineButton). The item opens the same window that button opens; the pipeline's
// window reads the editor's form, so here it gets an empty one, as a new pipeline has.
const BUILD_WITH_AI = {
  agents: GenerateAgentModal,
  pipelines: props => (
    <Formik
      initialValues={{}}
      onSubmit={() => {}}
    >
      <AIEditPipelineModal
        {...props}
        isCreateMode
      />
    </Formik>
  ),
  skills: GenerateSkillModal,
};

// «+» that also holds Import where the kind has it (variants α and β): one menu «New agent / Import from file», as
// «New ▾» on GitHub and Notion, plus «Build with AI» where the kind has it. Where there is neither the «+» creates at
// once, as before. The items call the same actions as the product's buttons (useImport; useSkillImport with its
// confirmation window; the Build with AI windows), with the product's icons (AddDimensionMenu: icon, then the words).
// «+ Add ⌄» (owner 2026-11-12, as Claude's «+ Add»: the words and the arrow say it opens a list). The design system
// has no one-part dropdown button: its Button «Special / Split» (Alita Library 4711:10302; the sidebar's
// CreateEntityButton) is two parts — «+ Label» creates, the arrow opens the list. This is that button's look in one
// part: special, plus, 12 px label, the same 16 px «arrow down» (ArrowDownIcon, turned while open). Where the tab has
// no list the «+ Add» creates at once, without the arrow, at the same width so nothing in the row moves.
const AddLabelButton = ({ label, open, menu, ...props }) => (
  <Tooltip
    title={label}
    placement="top"
  >
    <Box component="span">
      <Button.BaseBtn
        variant="special"
        startIcon={<PlusIcon />}
        endIcon={
          menu ? (
            <ArrowDownIcon
              fill="currentColor"
              style={open ? styles.arrowOpen : undefined}
            />
          ) : undefined
        }
        aria-label={label}
        sx={styles.addLabelButton}
        {...props}
      >
        Add
      </Button.BaseBtn>
    </Box>
  </Tooltip>
);

// A menu row as the design system's «Dropdown list item» (Alita Library 15:2750): 14/24, regular, white text; the
// product's icon on the left as in its «⋮» menus (DotMenu).
const MenuText = ({ children }) => (
  <Typography
    variant="bodyMedium"
    color="text.secondary"
  >
    {children}
  </Typography>
);

const AddMenu = memo(({ section }) => {
  const [anchor, setAnchor] = useState(null);
  const [building, setBuilding] = useState(false);
  const { openFileDialog } = useImport();
  const skill = useSkillImport();
  const own = useHasOwnProject();
  const label = `Add ${lower(section.one)}`;
  const BuildWithAi = BUILD_WITH_AI[section.key];
  if ((!IMPORT[section.key] || !own) && !BuildWithAi) return <AddLabelButton label={label} />;
  const close = () => setAnchor(null);
  const onImport = () => {
    close();
    (section.key === 'skills' ? skill.openFileDialog : openFileDialog)();
  };
  const onBuild = () => {
    close();
    setBuilding(true);
  };
  return (
    <>
      <AddLabelButton
        label={label}
        menu
        open={Boolean(anchor)}
        aria-haspopup="menu"
        onClick={event => setAnchor(event.currentTarget)}
      />
      <Menu
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={close}>
          <ListItemIcon sx={styles.menuIcon}>
            <PlusIcon />
          </ListItemIcon>
          <MenuText>{`New ${lower(section.one)}`}</MenuText>
        </MenuItem>
        {IMPORT[section.key] && own && (
          <MenuItem onClick={onImport}>
            <ListItemIcon sx={styles.menuIcon}>
              <ImportIcon />
            </ListItemIcon>
            <MenuText>Import from file</MenuText>
          </MenuItem>
        )}
        {BuildWithAi && (
          <MenuItem onClick={onBuild}>
            <ListItemIcon sx={styles.menuIcon}>
              <SparkleIcon />
            </ListItemIcon>
            <MenuText>Build with AI</MenuText>
          </MenuItem>
        )}
      </Menu>
      {BuildWithAi && building && (
        <BuildWithAi
          open
          onClose={() => setBuilding(false)}
        />
      )}
      {section.key === 'skills' && (
        <SkillImportModal
          open={skill.isModalOpen}
          skill={skill.pendingSkill}
          fileName={skill.pendingFileName}
          isImporting={skill.isImporting}
          onClose={skill.cancelImport}
          onConfirm={skill.confirmImport}
        />
      )}
    </>
  );
});
AddMenu.displayName = 'AddMenu';

// The filter switch inside the search field (variant β): narrowing the list by words and by folders and tags sit
// together, as the options button in Gmail's search field. A 28 px tertiary icon button at the field's right end.
const FieldFiltersButton = memo(({ open, onToggle, count }) => (
  <Box sx={styles.fieldFilters}>
    <FiltersIconButton
      open={open}
      onToggle={onToggle}
      count={count}
    />
  </Box>
));
FieldFiltersButton.displayName = 'FieldFiltersButton';

// The page's row (β, owner 2026-11-12): Yours / Discover where a catalog exists, then the view switch, the search field
// with the filter switch inside it, and «+» with the section's create menu (Import lives in that menu).
const ActionsToolbar = memo(props => {
  const { mode, onMode, section, discover, filters, filtersOpen, onFilters, filterCount, query, onQuery } =
    props;
  return (
    <Box sx={styles.toolbar}>
      {onMode && (
        <Tab.TabGroupButton
          value={mode}
          onChange={(_, value) => value && onMode(value)}
          arrayBtn={MODES}
        />
      )}
      <Box sx={styles.grow} />
      {!discover && <ViewToggle />}
      <SearchField
        query={query}
        onQuery={onQuery}
        placeholder={`Search ${lower(section.label)}`}
        endAdornment={
          filters && (
            <FieldFiltersButton
              open={filtersOpen}
              onToggle={onFilters}
              count={filterCount}
            />
          )
        }
      />
      <AddMenu
        key={section.key}
        section={section}
      />
    </Box>
  );
});
ActionsToolbar.displayName = 'ActionsToolbar';

// One section's own page, opened from Explore's hover list (owner 2026-11-13): its name as the title, the row, the list.
export const SectionPage = memo(() => {
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();
  // The open section is shared with Explore's list in the menu (sectionTab.js).
  const { tab: section } = useSectionTab();
  const [mode, setMode] = useState('yours');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const current = SECTIONS.find(s => s.key === section);
  // Yours / Discover only where a catalog of this kind exists today: Agents, Skills, Applications.
  const discover = Boolean(DISCOVER[section]) && mode === 'discover';
  const filters = !discover || CATALOG_COLUMN.has(section);
  const listRef = useRef(null);
  const filterCount = useFilterCount(listRef, discover);
  customizeSection.key = section; // the sample tag answer follows the open section (data.js)

  // The product's lists take the search from the store (state.search.query), as the dev search bar sets it.
  useEffect(() => {
    dispatch(searchActions.setQuery({ query: discover ? '' : query }));
  }, [dispatch, discover, query]);

  // Another section starts clean, as opening another list page does: no search, no folder or tag filter, Yours. The
  // filter column keeps its open or closed state: it is the user's choice of layout, not a filter.
  const firstSection = useRef(section);
  useEffect(() => {
    if (section === firstSection.current) return;
    firstSection.current = null;
    setMode('yours');
    setQuery('');
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete(URL_PARAMS_KEY_TAGS);
        next.delete('folder');
        return next;
      },
      { replace: true },
    );
  }, [section, setSearchParams]);

  return (
    <Box sx={styles.page}>
      <Title variant="headingLarge">{current.label}</Title>
      <ActionsToolbar
        mode={mode}
        onMode={DISCOVER[section] ? setMode : undefined}
        section={current}
        discover={discover}
        filters={filters}
        filtersOpen={filtersOpen}
        onFilters={() => setFiltersOpen(open => !open)}
        filterCount={filterCount}
        query={query}
        onQuery={setQuery}
      />
      <Box
        key={`${section}-${mode}`}
        ref={listRef}
        sx={[
          styles.list,
          !discover && !filtersOpen && styles.noPanel,
          discover && !filtersOpen && styles.noCatalogColumn,
        ]}
      >
        {discover ? DISCOVER[section](query) : YOURS[section]}
      </Box>
    </Box>
  );
});
SectionPage.displayName = 'SectionPage';

/** @type {MuiSx} */
const styles = {
  page: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1.5rem 0', // 24 px at the sides, as every list page (DrawerPageHeader, Agents) and the library Header
    gap: '1rem',
    boxSizing: 'border-box',
  },
  titleBlock: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '1rem' }, // search and «+» 16 px apart, as DrawerPageHeader
  grow: { flex: 1 },
  // The filter button at the field's right end: the field's 12 px padding minus 8 px, so the icon sits 4 px from its edge.
  fieldFilters: { display: 'flex', marginRight: '-0.5rem', flexShrink: 0 },
  toolIcon: { '& svg': { flexShrink: 0 } },
  icon16: { width: '1rem', height: '1rem' },
  // A 14 px count in the accent of the team's primary button (its ground and text), at the icon's top right.
  filterDot: ({ palette, typography }) => ({
    '& .MuiBadge-badge': {
      ...typography.labelSmall,
      fontSize: '0.625rem',
      lineHeight: '0.875rem',
      minWidth: '0.875rem',
      height: '0.875rem',
      padding: '0 0.25rem',
      transform: 'translate(65%, -45%)', // on the icon's corner, into the button's 6 px padding, not over the glyph
      color: palette.components.button.text.primary,
      backgroundColor: palette.components.button.background.primary.default,
    },
  }),
  // Without the right column: the product's fixed panel (the one Grid that is not the card grid) is hidden and the
  // cards or the table take the whole width; the grid measures itself, so a third column of cards appears.
  noPanel: {
    paddingRight: 0,
    '& > .MuiGrid-root:not(.MuiGrid-container)': { display: 'none' },
    '& > *': { width: '100% !important' }, // component-check: allow the product's list keeps the panel's width free otherwise
  },
  // The catalog's column (CatalogBody: a vertical line, then the Featured and Categories rail) hidden; its chips stay
  // mounted, so the picked categories keep filtering and the filter icon can count them.
  noCatalogColumn: {
    '& .MuiDivider-vertical, & .MuiDivider-vertical + *': { display: 'none' },
  },
  // The product's list as on its own page, under the Customize header. Its folders-and-tags panel is position: fixed to
  // the window's top right (RightPanel.jsx); the transform makes this box its frame, so the panel starts at the list's
  // top instead of covering the header. The cards scroll inside the box, the panel stays.
  list: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    transform: 'translateZ(0)',
    overflow: 'hidden',
    // Left: the cards' own 1.5rem inset lines them up with the header. Right: the panel's 12 px gap ends it at the «+».
    marginInline: '-1.5rem -0.75rem',
    // The grid stops 16 px before the panel's content, the same gap as between cards (the panel is fixed, so this
    // padding narrows only the grid).
    paddingRight: '0.75rem',
    '& > .MuiGrid-container': {
      height: '100%',
      overflowY: 'auto !important',
      alignContent: 'flex-start',
      paddingBottom: '1.5rem',
    },
  },
  // Search 2.25rem high as the library Search bar; 19.5rem (312 px) wide as the library and the Agents list (owner 2026-11-11).
  search: { width: '19.5rem', flexShrink: 0 },
  // As the team's collapsed Create button (CreateEntityButton.jsx simpleButton): the special look at 1.75rem.
  addButton: { width: '1.75rem !important', minWidth: '1.75rem !important' }, // component-check: allow the team's collapsed Create button size (CreateEntityButton.jsx simpleButton)
  // «+ Add ⌄» and «+ Add» one width (the arrow's 16 px and its 8 px gap), so the search left of it never moves.
  addLabelButton: { width: '6.6875rem', flexShrink: 0 }, // component-check: allow 107 px, the natural width of «+ Add ⌄», kept by «+ Add» without the arrow
  arrowOpen: { transform: 'rotate(180deg)' },
  // The product's menu icons: 16 px, 12 px before the words (AddDimensionMenu).
  menuIcon: ({ palette }) => ({
    minWidth: '1.75rem !important', // component-check: allow MUI's 36 px icon slot narrowed to the product menu's 16 px icon + 12 px (AddDimensionMenu)
    '& svg': { width: '1rem', height: '1rem' },
    '& path': { fill: palette.icon.default },
  }),
};
