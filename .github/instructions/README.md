# EliteA UI - GitHub Copilot Instructions

This directory contains comprehensive GitHub Copilot instructions tailored specifically for the EliteA UI
project. These instructions help Copilot provide more accurate, context-aware suggestions that align with our
coding standards and architectural patterns.

## 📁 File Structure

### Main Instructions

- **`../copilot-instructions.md`** - Primary instructions file (automatically read by GitHub Copilot)
  - Project overview and technology stack
  - Feature-Sliced Design (FSD) architecture patterns
  - Import standards and file structure conventions
  - Component development patterns and styling guidelines
  - Custom hooks and utility organization
  - Pixel to rem conversion guide
  - Performance optimization patterns

### Specialized Instructions (`instructions/`)

- **`components.md`** - Component development patterns, FSD organization, and composition strategies
- **`api-state.md`** - API integration and state management with RTK Query
- **`styling.md`** - Material-UI theming and styling standards (extended examples)
- **`testing.md`** - Playwright + Cucumber testing patterns and best practices
- **`performance.md`** - Performance optimization and best practices

### Documentation

- **`README.md`** - This file, providing an overview of the instructions structure

## 🚀 How to Use These Instructions

### For Individual Developers

1. **GitHub Copilot automatically reads** `../copilot-instructions.md` when you're working in this repository
2. **Follow FSD architecture patterns** when creating new features or components
3. **Use explicit import paths** with layer specification (e.g., `@/[fsd]/features/my-feature/ui`)
4. **Apply consistent styling patterns**:
   - Use `/** @type {MuiSx} */` for style functions
   - Convert pixels to rem units
   - Use theme callbacks instead of passing theme
5. **Reference specialized guides** when working on specific areas:
   - Building components? Check `components.md` for FSD patterns and composition strategies
   - Working with APIs? Reference `api-state.md`
   - Complex styling? Check `styling.md`
   - Writing tests? Follow `testing.md`
   - Optimizing performance? Review `performance.md`

### For Team Leads

1. **Update instructions** as patterns evolve
2. **Ensure new team members** review these files during onboarding
3. **Reference in code reviews** to maintain consistency
4. **Add project-specific patterns** as they emerge
5. **Monitor bundle size** and performance metrics after refactoring

## 🎯 Key Benefits

- **Consistent Code Quality**: Copilot suggestions align with our established patterns
- **Faster Onboarding**: New developers get instant context about our conventions
- **Better Architecture**: Promotes reuse of existing components and patterns
- **Reduced Code Review Overhead**: Less time correcting style and pattern issues

## 📖 What's Covered

### Architecture & Structure

- ✅ Feature-Sliced Design (FSD) architecture with clear layer separation
- ✅ Explicit import paths with layer specification
- ✅ Named exports for better tree-shaking
- ✅ Barrel exports for clean public APIs
- ✅ Custom hook organization in shared layer

### Technical Standards

- ✅ React 18.3+ with hooks and modern patterns
- ✅ Material-UI v7 theming and component usage
- ✅ Redux Toolkit + RTK Query for state management
- ✅ TypeScript/JavaScript best practices
- ✅ Import conventions with `@/` aliases
- ✅ Consistent JSDoc type annotations (`/** @type {MuiSx} */`)

### Styling & Theming

- ✅ sx prop with style functions (primary pattern)
- ✅ Theme callbacks instead of direct theme access
- ✅ Pixel to rem unit conversion (1px = 0.0625rem)
- ✅ Theme token usage from design tokens
- ✅ Responsive and conditional styling patterns
- ✅ Nested selectors and complex styles

### Development Patterns

- ✅ Component composition and reusability
- ✅ Consistent prop destructuring inside component body
- ✅ React.memo() with displayName for all components
- ✅ API integration and caching strategies
- ✅ Form handling with Formik + Yup
- ✅ Error handling and loading states
- ✅ Performance optimization techniques

### Quality Assurance

- ✅ Testing patterns with Playwright + Cucumber
- ✅ Accessibility standards and ARIA usage
- ✅ Security best practices
- ✅ Code organization and cleanup
- ✅ ESLint and Prettier configuration compliance

## 🆕 Recent Improvements (2025)

### Feature-Sliced Design Migration

The project has undergone a comprehensive migration to Feature-Sliced Design architecture. Key improvements
include:

- **Explicit Import Paths**: Always specify the layer (e.g., `/ui`, `/lib`, `/api`)
- **Named Exports**: Preferred over default exports for better tree-shaking
- **Style Function Patterns**: Standardized `/** @type {MuiSx} */` with theme callbacks
- **Rem Unit Conversion**: All pixel values converted to rem for accessibility
- **Hook Organization**: Shared hooks moved to `src/[fsd]/shared/lib/hooks/`
- **Component Extraction**: Reusable components properly extracted and organized

These patterns are documented in the main `copilot-instructions.md` file with examples and best practices.

## 🔄 Updating Instructions

When updating these instructions:

1. **Test changes** with Copilot in a feature branch
2. **Get team feedback** on new patterns or conventions
3. **Update relevant specialized files** along with main instructions
4. **Document breaking changes** or new requirements
5. **Document new architectural patterns** in the main copilot-instructions.md
6. **Notify team** of significant updates

## 📝 Contributing

To improve these instructions:

1. **Identify gaps** in current coverage
2. **Propose new patterns** based on project evolution
3. **Submit changes** via pull request
4. **Include examples** of better Copilot suggestions after updates

## ❓ Questions?

If you have questions about these instructions or need clarification on specific patterns, please:

1. Check the relevant specialized instruction file first
2. Search existing code for similar patterns
3. Ask in team chat or during code review
4. Suggest improvements via pull request

---

**Last Updated**: August 2, 2025  
**Version**: 1.0  
**Maintained by**: Development Team
