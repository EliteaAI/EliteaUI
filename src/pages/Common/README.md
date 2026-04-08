# Common Components

This folder contains shared components that are used by both Prompts and Applications modules to eliminate
code duplication and ensure consistency across the application.

## Structure

```
Common/
├── Components/
│   ├── StyledComponents.jsx      # Common styled components
│   ├── AuthorsButton.jsx         # Generic authors display component
│   ├── DetailToolbar.jsx         # Common toolbar component
│   ├── LikeButton.jsx           # Generic like/heart button component
│   ├── DeleteButton.jsx         # Generic delete functionality
│   ├── AddToCollectionDialog.jsx # Collection management dialog
│   └── index.js                 # Component exports
└── index.js                     # Main exports
```

## Migrated Components

### From Prompts

- **StyledComponents**: Common styled components (ContentContainer, LeftGridItem, etc.)
- **AuthorsButton**: Author avatar display functionality
- **DetailToolbar**: Toolbar with menu items and actions
- **LikePromptButton**: Like functionality (generalized to LikeButton)
- **DeletePromptButton**: Delete functionality (generalized to DeleteButton)
- **AddToCollectionDialog**: Dialog for adding items to collections

### From Applications

- **AuthorsButton**: Duplicate implementation merged
- **LikeApplicationButton**: Merged into generic LikeButton
- **DeleteApplicationButton**: Merged into generic DeleteButton

## Usage

### AuthorsButton

```jsx
import { AuthorsButton } from '@/pages/Common';

// For Prompts
<AuthorsButton entityType="prompts" />

// For Applications
<AuthorsButton entityType="applications" />
```

### LikeButton

```jsx
import { LikeButton } from '@/pages/Common';

// For Prompts
<LikeButton entityType="prompts" ariaLabel="Like this prompt" />

// For Applications
<LikeButton entityType="applications" ariaLabel="Like this agent" />
```

### DeleteButton

```jsx
import { DeleteButton } from '@/pages/Common';

// For Prompts
<DeleteButton entityType="prompts" />

// For Applications (with nav blocking)
<DeleteButton entityType="applications" setBlockNav={setBlockNav} />
```

### Styled Components

```jsx
import { ContentContainer, DetailSkeleton, LeftGridItem } from '@/pages/Common';

// Use the shared styled components across both modules
```

## Benefits

1. **Code Deduplication**: Eliminated duplicate implementations between Prompts and Applications
2. **Consistency**: Ensures UI/UX consistency across different modules
3. **Maintainability**: Single source of truth for common functionality
4. **Reusability**: Components can be easily extended for future modules
5. **Type Safety**: Proper TypeScript support with entity type discrimination

## Migration Notes

- Original Prompts components now re-export from Common for backward compatibility
- Applications components updated to use Common implementations
- Entity-specific logic handled through `entityType` props
- Maintained all existing functionality while reducing code duplication

## Future Enhancements

- Add more common components as patterns emerge
- Implement proper TypeScript definitions
- Add comprehensive unit tests for shared components
- Consider extracting common hooks and utilities
