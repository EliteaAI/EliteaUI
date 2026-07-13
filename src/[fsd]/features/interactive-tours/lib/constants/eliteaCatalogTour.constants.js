import { ELITEA_CATALOG_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/eliteaCatalogTourTargets.constants';

export const ELITEA_CATALOG_TOUR_ID = 'elitea-catalog';

export const ELITEA_CATALOG_TOUR_COMPLETION = {
  keepExploring: [],
};

export const eliteaCatalogTourSteps = [
  {
    id: 'what-is-elitea-catalog',
    target: ELITEA_CATALOG_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What is ELITEA Catalog?',
    content: `ELITEA Catalog is a shared library of community-published Agents and Skills. Unlike the Agents and Skills menus — where you create and manage your own — the Catalog gives you read-only access to entities published by other users across all projects.

Switch between the **Agents** and **Skills** tabs to browse, preview, and reuse published content without building it from scratch.`,
  },
  {
    id: 'search-and-category-filters',
    target: ELITEA_CATALOG_TOUR_TARGETS.searchAndCategoryFilters,
    placement: 'bottom',
    title: 'Search & Category Filters',
    content: `Use search and category filters together to narrow the library to what you need:

- **Search** — find agents or skills by name or description; results update as you type
- **Category filters** — filter by Trending, My Liked, or domain categories
- Multiple category filters can be active simultaneously`,
  },
  {
    id: 'entity-discovery',
    target: ELITEA_CATALOG_TOUR_TARGETS.entityCard,
    placement: 'bottom',
    title: 'Discovery',
    content: `Published agents and skills are displayed as cards organized by category. Each card shows the name, creator, and like count. Click a card to open a full detail view with the description and read-only instructions — giving you a complete picture before you use it.`,
  },
  {
    id: 'liking-entities',
    target: ELITEA_CATALOG_TOUR_TARGETS.likeButton,
    placement: 'top',
    title: 'Liking',
    content: `Click the **heart icon** on any card or detail view to like or unlike an agent or skill. Liked items are saved under the **My Liked** category filter so you can find them quickly later.`,
  },
  {
    id: 'using-catalog-entities',
    target: ELITEA_CATALOG_TOUR_TARGETS.primaryActionButton,
    placement: 'left',
    title: 'Using an Agent or Skill',
    content: `From an agent's detail view, click **Start conversation** to open a chat with the agent already added. From a skill's detail view, click **Add to Agent** to attach the skill to one or more of your agents — and optionally test it in Chat right away.`,
  },
];
