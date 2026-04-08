# Component Development Instructions

## Component Architecture Philosophy

EliteA UI follows a **composition-over-inheritance** approach with a sophisticated component hierarchy designed
for AI chat applications. The project uses **Feature-Sliced Design (FSD)** architecture for better code
organization.

> **Note**: This document provides comprehensive component development patterns. Also refer to the main
> `copilot-instructions.md` file for:
>
> - FSD import path conventions
> - Style function patterns with `/** @type {MuiSx} */`
> - Pixel to rem conversion guide
> - Component boilerplate examples

## Component Categories

### 1. FSD Architecture Components (`/src/[fsd]`)

#### Shared Layer (`/src/[fsd]/shared/ui`)

Reusable UI components used across multiple features. These are generic, domain-agnostic components.

**Examples:**

- Button, Input, Modal components
- Layout components (containers, grids)
- Feedback components (toasts, alerts, loading)

#### Feature Layer (`/src/[fsd]/features/{domain}/ui`)

Feature-specific UI components that implement business logic for a particular domain.

**Examples:**

- `/features/pipelines/flow-editor/ui/nodes/` - Pipeline node components
- `/features/pipelines/ai-assistant/ui/` - AI assistant UI components
- `/features/chat/ui/` - Chat-specific components

#### Entity Layer (`/src/[fsd]/entities/{entity}/ui`)

Components representing business entities (User, Project, Conversation, etc.).

**Examples:**

- `UserCard`, `UserAvatar` - User entity components
- `ProjectCard`, `ProjectSelect` - Project entity components
- `ConversationItem` - Conversation entity components

### 2. Legacy Components (Pre-FSD Structure)

#### Base Components (`/components`)

Reusable UI building blocks that extend Material-UI components with custom theming.

**Examples:**

- `Button.jsx` - Custom button with variants (primary, secondary, tertiary)
- `TextField.jsx` - Enhanced text input with validation
- `DataGrid.jsx` - Advanced data table with sorting/filtering
- `StyledDialog.jsx` - Themed modal dialogs

#### ComponentsLib (`/ComponentsLib`)

Lower-level, highly reusable component primitives.

**Examples:**

- `AutoCompleteDropDown.jsx` - Smart autocomplete component
- `Tooltip.jsx` - Enhanced tooltip component
- `CircularProgress.jsx` - Loading indicators

### 3. Component Placement Guidelines

**When creating a new component, ask:**

1. **Is it domain-agnostic and reusable?** → Place in `/src/[fsd]/shared/ui/`
2. **Is it specific to a feature/domain?** → Place in `/src/[fsd]/features/{domain}/ui/`
3. **Does it represent a business entity?** → Place in `/src/[fsd]/entities/{entity}/ui/`
4. **Is it legacy code?** → Keep in `/components` or `/ComponentsLib` (gradually migrate to FSD)

## Component Development Standards

### Component File Structure

Always prefer **functional components** wrapped with `React.memo` for performance. Every component should have
a `displayName` for better debugging. The primary styling method is the `sx` prop combined with a style
function, not the `styled()` API.

**Props handling conventions:**

- Accept `props` as a single parameter to the component function.
- Destructure props on the first line inside the component body, with default values where applicable.

**Import conventions (FSD):**

- Use explicit layer imports: `@/[fsd]/features/my-feature/ui`
- Prefer named exports for better tree-shaking
- Group related imports from the same module

```javascript
// ✅ Correct component structure with FSD patterns
import { memo, useCallback, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { MyHelper } from '@/[fsd]/features/my-feature/lib/helpers';
// FSD imports with explicit layer specification
import { useMyFeature } from '@/[fsd]/features/my-feature/lib/hooks';

/** @type {MuiSx} */
const componentStyles = isEnabled => ({
  container: ({ palette, spacing }) => ({
    padding: spacing(2), // Use spacing function (2 * 8 = 16px = 1rem)
    backgroundColor: isEnabled ? palette.background.paper : palette.background.default,
    opacity: isEnabled ? 1 : 0.5,
    borderRadius: '0.5rem', // Use rem units (8px)
    border: `0.0625rem solid ${palette.border.lines}`, // 1px in rem
  }),
  title: ({ palette }) => ({
    typography: 'headingMedium',
    color: palette.text.primary,
  }),
});

const MyComponent = memo(props => {
  const { title, onAction, isEnabled = false } = props;
  const styles = componentStyles(isEnabled);

  const handleAction = useCallback(() => {
    onAction?.();
  }, [onAction]);

  const computedValue = useMemo(() => {
    // perform expensive calculation
    return title.toUpperCase();
  }, [title]);

  return (
    <Box
      sx={styles.container}
      onClick={handleAction}
    >
      <Typography sx={styles.title}>{computedValue}</Typography>
    </Box>
  );
});

MyComponent.displayName = 'MyComponent';

export default MyComponent;
```

### Component Creation Checklist

- [ ] Wrap component in `React.memo()`.
- [ ] Set a `displayName` for the component.
- [ ] Destructure `props` inside the component body, not in the function signature.
- [ ] Use `useMemo` for expensive computations or derived data.
- [ ] Use `useCallback` for all event handlers passed to child components.
- [ ] Follow the standard import organization with explicit FSD layer paths.
- [ ] Extract inline styles into style function at bottom of file.
- [ ] Use `/** @type {MuiSx} */` JSDoc annotation for style functions.
- [ ] Convert all pixel values to rem units.
- [ ] Use theme callbacks `({ palette }) => ({...})` instead of passing theme.
- [ ] Use named exports for components in FSD structure (when appropriate).

### Component Extraction and Organization

#### When to Extract a Component

Extract a component into its own file when:

1. **Reusability**: Component is used in multiple places
2. **Complexity**: Component has significant logic or JSX (>50 lines)
3. **Testability**: Component needs isolated unit testing
4. **Separation of Concerns**: Component handles a specific responsibility

```javascript
// ❌ Before: Inline component definition
const ParentComponent = () => {
  return (
    <Box>
      {/* Large inline component */}
      <Box sx={{ padding: '1rem', display: 'flex' }}>
        <Typography>Header Content</Typography>
        {/* ... 50+ lines of JSX */}
      </Box>
    </Box>
  );
};

// ✅ After: Extracted to separate file
// AIAssistantPanelHeader.jsx
export const AIAssistantPanelHeader = memo(props => {
  const { title, actions } = props;
  const styles = aiAssistantPanelHeaderStyles();

  return (
    <Box sx={styles.header}>
      <Typography sx={styles.title}>{title}</Typography>
      {actions}
    </Box>
  );
});

AIAssistantPanelHeader.displayName = 'AIAssistantPanelHeader';
```

#### FSD Export Patterns

**Feature Layer Exports:**

```javascript
// Usage with explicit layer path
import { MyFeatureComponent, MyFeatureHeader } from '@/[fsd]/features/my-feature/ui';

// features/my-feature/ui/index.js - Barrel export
export { MyFeatureComponent } from './MyFeatureComponent';
export { MyFeatureHeader } from './MyFeatureHeader';
export { MyFeatureList } from './MyFeatureList';
```

**Shared Layer Exports:**

```javascript
// Usage
import { Button } from '@/[fsd]/shared/ui/Button';

// shared/ui/Button/index.js
export { default as Button } from './Button';
```

### Component Composition Patterns

#### 1. Compound Components

```javascript
// ✅ Card with composable parts
export const DataCard = ({ children, ...props }) => <Card {...props}>{children}</Card>;

DataCard.Header = ({ children }) => <CardHeader>{children}</CardHeader>;

DataCard.Content = ({ children }) => <CardContent>{children}</CardContent>;

DataCard.Actions = ({ children }) => <CardActions>{children}</CardActions>;

// Usage:
<DataCard>
  <DataCard.Header>Title</DataCard.Header>
  <DataCard.Content>Content</DataCard.Content>
  <DataCard.Actions>
    <Button>Action</Button>
  </DataCard.Actions>
</DataCard>;
```

#### 2. Render Props Pattern

```javascript
// ✅ Flexible data rendering
export const DataRenderer = ({ data, children }) => {
  const [filteredData, setFilteredData] = useState(data);

  return children({
    data: filteredData,
    setFilter: setFilteredData,
  });
};

// Usage:
<DataRenderer data={items}>
  {({ data, setFilter }) => (
    <div>
      <SearchInput onChange={setFilter} />
      <ItemList items={data} />
    </div>
  )}
</DataRenderer>;
```

## Theme Integration

### Using Custom Theme Variants

```javascript
// ✅ Use existing typography variants
<Typography variant="headingMedium">Section Title</Typography>
<Typography variant="bodySmall">Helper text</Typography>
<Typography variant="labelSmall">Form label</Typography>

// ✅ Access theme colors
const StyledBox = styled(Box)(({ theme }) => ({
  color: theme.palette.text.secondary,
  backgroundColor: theme.palette.background.button.secondary.default,
  '&:hover': {
    backgroundColor: theme.palette.background.button.secondary.hover,
  },
}));
```

### Button Variants

```javascript
// ✅ Use established button patterns
<Button color="primary">Primary Action</Button>
<Button color="secondary">Secondary Action</Button>
<Button color="tertiary">Minimal Action</Button>

// ✅ Custom styling with theme
<Button sx={(theme) => ({
  ...eliteaButtonStyle(theme, 'primary'),
  minWidth: '120px',
})}>
  Custom Styled
</Button>
```

## Form Components

### Formik Integration Pattern

```javascript
// ✅ Standard form component
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import TextField from '@/components/TextField';

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  description: Yup.string().max(1000, 'Too long'),
});

const MyForm = ({ initialValues, onSubmit }) => (
  <Formik
    initialValues={initialValues}
    validationSchema={validationSchema}
    onSubmit={onSubmit}
  >
    {({ isSubmitting, errors, touched }) => (
      <Form>
        <TextField
          name="name"
          label="Name"
          error={touched.name && errors.name}
          helperText={touched.name && errors.name}
        />
        <TextField
          name="description"
          label="Description"
          multiline
          rows={4}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </Form>
    )}
  </Formik>
);
```

## Data Display Components

### Table/Grid Patterns

```javascript
// ✅ Use existing DataGrid component
import DataGrid from '@/components/DataGrid';

const MyDataTable = ({ data, onRowClick }) => {
  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'status', headerName: 'Status', width: 120 },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        renderCell: params => <Button onClick={() => handleAction(params.row)}>Edit</Button>,
      },
    ],
    [],
  );

  return (
    <DataGrid
      rows={data}
      columns={columns}
      onRowClick={onRowClick}
      getRowId={row => row.id}
    />
  );
};
```

### List Components

```javascript
// ✅ Reusable list pattern
const ItemList = ({ items, onItemClick, renderItem }) => (
  <Box>
    {items.map(item => (
      <Box
        key={item.id}
        onClick={() => onItemClick?.(item)}
        sx={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {renderItem ? renderItem(item) : <Typography>{item.name}</Typography>}
      </Box>
    ))}
  </Box>
);
```

## Modal and Dialog Patterns

### Using StyledDialog

```javascript
// ✅ Standard dialog pattern
import { StyledDialog } from '@/components/StyledDialog';

const MyDialog = ({ open, onClose, title, children }) => (
  <StyledDialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
  >
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    <DialogActions>
      <Button
        onClick={onClose}
        color="secondary"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        color="primary"
      >
        Save
      </Button>
    </DialogActions>
  </StyledDialog>
);
```

## Loading and Empty States

### Standard Loading Patterns

```javascript
// ✅ Consistent loading states
import EmptyListBox from '@/components/EmptyListBox';
import LoadingIndicator from '@/components/LoadingIndicator';

const DataComponent = ({ data, isLoading, error }) => {
  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length)
    return (
      <EmptyListBox
        message="No items found"
        actionButton={<Button>Add Item</Button>}
      />
    );

  return <ItemList data={data} />;
};
```

## Icon and Asset Usage

### SVG Icon Patterns

```javascript
// ✅ Use existing icon components
import { Add as AddIcon } from '@mui/icons-material';

import { ReactComponent as AgentIcon } from '@/assets/agent-icon.svg';

const IconButton = () => <Button startIcon={<AgentIcon />}>Create Agent</Button>;
```

## Accessibility in Components

### ARIA and Semantic HTML

```javascript
// ✅ Accessible component patterns
const AccessibleButton = ({ onClick, children, ariaLabel }) => (
  <Button
    onClick={onClick}
    aria-label={ariaLabel}
    role="button"
    tabIndex={0}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick();
        e.preventDefault();
      }
    }}
  >
    {children}
  </Button>
);

const AccessibleList = ({ items, onItemSelect }) => (
  <Box
    role="list"
    aria-label="Item list"
  >
    {items.map((item, index) => (
      <Box
        key={item.id}
        role="listitem"
        aria-posinset={index + 1}
        aria-setsize={items.length}
        tabIndex={0}
        onClick={() => onItemSelect(item)}
        onKeyDown={e => {
          if (e.key === 'Enter') onItemSelect(item);
        }}
      >
        {item.name}
      </Box>
    ))}
  </Box>
);
```

## Performance Optimization

### Memoization Guidelines

- Use `useMemo` for expensive calculations and derived data.
- Use `useCallback` for event handlers passed as props to child components.
- Use `React.memo` on components to prevent re-renders when props have not changed.
- **Always add a `displayName` to memoized components for better debugging.**

```javascript
// ✅ Proper memoization with derived data and stable callbacks
const MyComponent = memo(props => {
  const { id, data, onSelect } = props;

  // Memoize complex data transformations
  const options = useMemo(
    () =>
      (data?.details?.tools || []).map(tool => ({
        label: tool.name,
        value: tool.id,
      })) || [],
    [data?.details?.tools],
  );

  const handleSelect = useCallback(item => onSelect(item.id), [onSelect]);

  return (
    <Select
      options={options}
      onSelect={handleSelect}
    />
  );
});

MyComponent.displayName = 'MyComponent';
export default MyComponent;
```

### Lazy Loading Components

```javascript
// ✅ Code splitting for large components
const HeavyModal = lazy(() => import('./HeavyModal'));

const MyComponent = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <Button onClick={() => setShowModal(true)}>Open Modal</Button>
      {showModal && (
        <Suspense fallback={<LoadingIndicator />}>
          <HeavyModal onClose={() => setShowModal(false)} />
        </Suspense>
      )}
    </div>
  );
};
```

## Testing Component Patterns

### Component Test Structure

```javascript
// MyComponent.test.jsx
import { Provider } from 'react-redux';

import { ThemeProvider } from '@mui/material/styles';

import { fireEvent, render, screen } from '@testing-library/react';

import MyComponent from './MyComponent';

const renderWithProviders = (component, { store, theme } = {}) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>,
  );
};

test('should render component with correct props', () => {
  renderWithProviders(
    <MyComponent
      title="Test Title"
      data={mockData}
    />,
  );

  expect(screen.getByText('Test Title')).toBeInTheDocument();
});
```

Remember: Always check existing components first before creating new ones. The EliteA UI component library is
extensive and covers most common patterns.
