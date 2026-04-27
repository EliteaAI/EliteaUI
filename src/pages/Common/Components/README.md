# Common Components

This folder contains shared components that are used across multiple modules in the AlitaUI application,
specifically between Prompts and Applications.

## Structure

```
/src/pages/Common/
├── Components/
│   ├── StyledComponents.jsx      # Shared styled components
│   ├── AuthorsButton.jsx         # Generic authors display component
│   ├── DetailToolbar.jsx         # Common toolbar component
│   ├── LikeButton.jsx           # Generic like functionality
│   ├── DeleteButton.jsx         # Generic delete functionality
│   ├── AddToCollectionDialog.jsx # Collection management dialog
│   └── index.js                 # Component exports
├── index.js                     # Main exports
└── README.md                    # This file
```

## Components

### StyledComponents.jsx

Contains all shared styled components used across Prompts and Applications:

- `LeftContentContainer` - Scrollable left panel container
- `ContentContainer` - Main content area with responsive scrolling
- `StyledGridContainer` - Grid container with responsive behavior
- `LeftGridItem` / `RightGridItem` - Grid items for layout
- `TabBarItems` - Container for tab bar elements
- `StyledUnfoldLessIcon` / `StyledUnfoldMoreIcon` - Themed icons
- `StyledIconButton` - Positioned icon button
- `TabContentDiv` - Content area for tabs
- `DetailSkeleton` - Loading skeleton component

### AuthorsButton.jsx

Generic component for displaying entity authors with support for:

- **Props:**
  - `entityType`: 'prompts' | 'applications'
  - `versions`: Optional direct versions array
- **Features:**
  - Automatic data source selection based on entity type
  - Avatar display with navigation to author pages
  - Tooltip support

### DetailToolbar.jsx

Common toolbar component used by both entity types:

- **Props:**
  - `rightContent`: React node for right side content
  - `toolbarItems`: Array of toolbar items
  - `toolbarMenuItems`: Array of dropdown menu items
- **Features:**
  - Responsive design
  - Dropdown menu integration
  - Consistent styling

### LikeButton.jsx

Generic like functionality supporting both entity types:

- **Components:**
  - `LikeButton` - Main component
  - `LongIconButton` - Styled button component (exported)
- **Hooks:**
  - `useLikeEntityMenu` - Menu item hook
- **Props:**
  - `entityType`: 'prompts' | 'applications'
  - `ariaLabel`: Accessibility label
  - `sx`: Additional styles
- **Features:**
  - Entity-specific data handling
  - Loading states
  - View mode restrictions

### DeleteButton.jsx

Generic delete functionality with entity-specific logic:

- **Hooks:**
  - `useDeleteEntityMenu` - Menu item hook
- **Props:**
  - `entityType`: 'prompts' | 'applications'
  - `setBlockNav`: Navigation blocking function (applications only)
- **Features:**
  - Permission checking
  - Entity-specific navigation behavior
  - Error handling and toasts

Common moderation actions component:

- **Props:**
  - `entityType`: 'prompts' | 'applications'
- **Features:**
  - Approve/reject functionality
  - Entity-specific API calls
  - Toast notifications
  - Navigation handling

### AddToCollectionDialog.jsx

Shared dialog for adding entities to collections:

- **Features:**
  - Project selection
  - Collection search and filtering
  - Permission checking
  - Collection creation
  - Pagination support

## Usage Examples

### Using the Common Components

```jsx
// Import from the common location
import {
  AuthorsButton,
  LikeButton,
  DeleteButton,
  DetailToolbar,
  ContentContainer
} from '@/pages/Common';

// Use with entity type specification
<AuthorsButton entityType="prompts" />
<LikeButton entityType="applications" />
<DeleteButton entityType="prompts" />
```

### Legacy Component Updates

Existing components have been updated to use the common implementations:

```jsx
// Old Prompts AuthorsButton
import AuthorsButton from './AuthorsButton';

// New implementation (in /pages/Prompts/Components/AuthorsButton.jsx)
import { AuthorsButton } from '@/pages/Common';

export default function PromptsAuthorsButton() {
  return <AuthorsButton entityType="prompts" />;
}
```

## Migration Benefits

1. **Code Deduplication**: Eliminated duplicate implementations between modules
2. **Consistency**: Ensures UI/UX consistency across entity types
3. **Maintainability**: Single source of truth for common functionality
4. **Reusability**: Components can be easily extended for future entity types
5. **Type Safety**: Entity type discrimination ensures proper functionality

## Backward Compatibility

All existing imports continue to work through re-exports in the original locations, ensuring no breaking
changes during the migration.
