---
applyTo: '**'
---

Coding standards, domain knowledge, and preferences that AI should follow.

# Project-Specific Copilot Instructions

## Design Standards & Reusability

- **Always search for and reuse existing elements** before creating new ones:
  - Check `/components` directory for existing UI components
  - Use design tokens from `/styles/tokens` or theme configuration
  - Reuse existing CSS classes, styled-components, or CSS modules
  - Follow established color palette, spacing, and typography scales
- **Component hierarchy**: Prefer composition over duplication
  - Example: Use `<Button variant="primary">` instead of creating `<PrimaryButton>`
- **Check design system**: Reference Figma/Storybook/design docs before implementing UI

## Backend & API Integration

- **Analyze existing API structure** before implementing:
  - Check `/api`, `/services`, or `/lib` directories for existing API clients
  - Reuse existing HTTP clients, interceptors, and error handlers
  - Follow established request/response patterns
  - Use existing API endpoints - never create fictional endpoints
- **API Integration patterns**:

  ```javascript
  // ❌ Bad - Creating new implementation
  const fetchUser = async (id) => {
    return fetch(`https://api.example.com/users/${id}`);
  };

  // ✅ Good - Reuse existing services
  import { apiClient } from "@/services/apiClient";
  import { ENDPOINTS } from "@/constants/endpoints";

  const fetchUser = async (id) => {
    return apiClient.get(ENDPOINTS.USER.GET_BY_ID(id));
  };
  ```

- **Understand data models**:
  - Follow existing data structure patterns
  - Maintain consistency with backend data structures
  - Reuse data transformation utilities if they exist

## Code Quality & Best Practices

- **No hardcoded values** - Extract all literals into:
  - Constants files (`/constants/*.js`)
  - Configuration objects (`/config/*.js`)
  - Environment variables for deployment-specific values
  - Theme tokens for UI values (colors, spacing, fonts)
- **Create reusable variables and constants**:

  ```javascript
  // ❌ Bad
  if (status === 'active') {
    margin: 16;
  }

  // ✅ Good
  const STATUS = { ACTIVE: 'active' };
  const SPACING = { md: 16 };
  if (status === STATUS.ACTIVE) {
    margin: SPACING.md;
  }
  ```

## Application Business Logic

- **Never invent or assume business logic**:
  - Reference existing implementations in the codebase
  - Follow established patterns for similar features
  - Maintain consistency with current data flows and state management
  - If unclear, add TODO comment for clarification
- **Respect existing architecture**:
  - Follow current folder structure and file naming conventions
  - Use established patterns (hooks, services, utilities)
  - Maintain separation of concerns
- **State Management**:
  - Use existing state management solution (Redux, Zustand, Context, etc.)
  - Follow established patterns for actions, reducers, or stores
  - Reuse existing selectors and state utilities

## Technology-Specific Standards

### JavaScript

- Use modern ES6+ syntax (arrow functions, destructuring, spread operator)
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate
- Follow existing code style for semicolons and quotes

### React & JSX

- Functional components with hooks (no class components)
- Custom hooks for reusable logic (prefix with `use`)
- Proper dependency arrays in hooks
- Memoization only when performance benefits are measurable
- **JSX Best Practices**:

  ```jsx
  // ❌ Bad
  <div className='container' style={{padding: 20}}>
    <p>{ userName }</p>
  </div>

  // ✅ Good
  <div className={styles.container}>
    <p>{userName}</p>
  </div>
  ```

- **PropTypes or existing validation patterns**:

  ```javascript
  // If project uses PropTypes
  import PropTypes from 'prop-types';

  Component.propTypes = {
    title: PropTypes.string.isRequired,
    count: PropTypes.number,
  };
  ```

### UI/UX

- Follow application's established interaction patterns
- Maintain consistent spacing, animations, and transitions
- Ensure accessibility (ARIA labels, keyboard navigation)
- Responsive design using existing breakpoint system

## Code Hygiene

- **Remove all unused code**:
  - Unused imports
  - Commented-out code blocks
  - Unused variables and functions
  - Empty files or redundant exports
- **Clean up before finalizing**:
  - Run linter and fix all warnings
  - Remove console.logs (except for debugging utilities)
  - Ensure no TODO comments remain unaddressed

## Documentation & Comments

- **Concise, purposeful comments**:

  ```javascript
  // ❌ Avoid redundant comments
  // This function adds two numbers
  const add = (a, b) => a + b;

  // ✅ Document complex logic or business rules
  // Apply discount only for premium users with 3+ orders
  const calculateDiscount = user => {
    if (user.tier === 'premium' && user.orderCount >= 3) {
      return DISCOUNT_RATES.PREMIUM_LOYAL;
    }
  };
  ```

- **Code documentation only**:
  - Brief inline comments for non-obvious business logic
  - JSDoc comments for complex functions if project uses them
  - NO separate documentation files unless explicitly requested
  - NO README updates unless specifically asked
  - NO changelog entries unless requested

## Analysis Before Implementation

- **Before suggesting any code**:
  1. Check for existing API endpoints and services
  2. Look for similar features already implemented
  3. Identify reusable components and utilities
  4. Understand the current data flow and state management
  5. Follow existing error handling patterns

## Examples of What to Check Before Coding

### API & Backend:

- `/api/*` - API route definitions
- `/services/*` - API client services
- `/lib/api/*` - API utilities
- `/constants/endpoints.js` - API endpoint constants
- `/config/*` - Configuration files

### Frontend:

- `/components/*` - Reusable UI components
- `/hooks/*` - Custom React hooks
- `/utils/*` - Utility functions
- `/styles/*` - Theme and style definitions
- `/store/*` or `/context/*` - State management

### Pattern Examples:

```javascript
// ❌ Don't create new API calls
const data = await fetch('/api/users');

// ✅ Use existing service layer
import { userService } from '@/services/userService';
const data = await userService.getUsers();

// ❌ Don't hardcode component styles
<Button style={{ backgroundColor: '#007bff', padding: '10px' }}>

// ✅ Use existing component variants
<Button variant="primary" size="medium">

// ❌ Don't create new state management patterns
const [users, setUsers] = useState([]);
useEffect(() => {
  fetchUsers().then(setUsers);
}, []);

// ✅ Use existing state management
import { useUsers } from '@/hooks/useUsers';
const { users, loading, error } = useUsers();
```

## File Extensions

- Use `.js` for pure JavaScript files
- Use `.jsx` for files containing JSX
- Follow project's existing naming conventions
