# Testing Standards and Best Practices

## Testing Architecture Overview

EliteA UI uses **Playwright** with **Cucumber** for comprehensive end-to-end testing, following a **Page Object
Model** pattern for maintainable and readable tests.

## Testing Structure

```
tests/
├── features/           # Cucumber feature files (.feature)
├── steps/             # Step definitions for Cucumber scenarios
├── page_object/       # Page Object Model classes
├── memory/            # Test data and state management
├── cucumber.ts        # Cucumber configuration
├── playwright.config.ts # Playwright configuration
└── run-tests.sh       # Test execution scripts
```

## Page Object Model Pattern

### Base Page Class

```javascript
// ✅ Base page pattern (tests/page_object/BasePage.js)
export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async navigate(url) {
    await this.page.goto(url);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async clickElement(selector) {
    await this.page.locator(selector).click();
  }

  async fillInput(selector, value) {
    await this.page.locator(selector).fill(value);
  }

  async getText(selector) {
    return await this.page.locator(selector).textContent();
  }

  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  async waitForElement(selector, timeout = 5000) {
    await this.page.locator(selector).waitFor({ timeout });
  }
}
```

### Feature-Specific Pages

```javascript
// ✅ Feature page example (tests/page_object/ApplicationsPage.js)
import { BasePage } from './BasePage.js';

export class ApplicationsPage extends BasePage {
  constructor(page) {
    super(page);

    // Selectors
    this.createButton = '[data-testid="create-application-button"]';
    this.searchInput = '[data-testid="search-input"]';
    this.applicationCard = '[data-testid="application-card"]';
    this.deleteButton = '[data-testid="delete-button"]';
    this.confirmDialog = '[data-testid="confirm-dialog"]';
    this.loadingIndicator = '[data-testid="loading-indicator"]';
  }

  async navigateToApplications(projectId) {
    await this.navigate(`/agents?project_id=${projectId}`);
    await this.waitForPageLoad();
  }

  async createNewApplication() {
    await this.clickElement(this.createButton);
    await this.waitForElement('[data-testid="create-form"]');
  }

  async searchApplications(searchTerm) {
    await this.fillInput(this.searchInput, searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForElement(this.applicationCard);
  }

  async deleteApplication(applicationName) {
    const applicationSelector = `${this.applicationCard}:has-text("${applicationName}")`;
    const deleteButton = `${applicationSelector} ${this.deleteButton}`;

    await this.clickElement(deleteButton);
    await this.waitForElement(this.confirmDialog);
    await this.clickElement('[data-testid="confirm-delete"]');

    // Wait for deletion to complete
    await this.page.waitForFunction(
      (selector, name) => !document.querySelector(`${selector}:has-text("${name}")`),
      [this.applicationCard, applicationName],
    );
  }

  async getApplicationCount() {
    return await this.page.locator(this.applicationCard).count();
  }

  async getApplicationNames() {
    const elements = await this.page
      .locator(`${this.applicationCard} [data-testid="application-name"]`)
      .all();
    return Promise.all(elements.map(el => el.textContent()));
  }

  async waitForApplicationsToLoad() {
    // Wait for loading to disappear
    await this.page.locator(this.loadingIndicator).waitFor({ state: 'hidden' });
  }
}
```

## Cucumber Feature Files

### Feature File Structure

```gherkin
# ✅ Feature file example (tests/features/applications.feature)
Feature: Application Management
  As a user
  I want to manage AI applications
  So that I can create and organize my AI agents

  Background:
    Given I am logged into the application
    And I have selected a project

  Scenario: Create a new application
    Given I am on the applications page
    When I click the create application button
    And I fill in the application form with:
      | Field       | Value                    |
      | Name        | Test Application         |
      | Description | A test application       |
      | Category    | Chat                     |
    And I click the save button
    Then I should see the new application in the list
    And the application should have status "Draft"

  Scenario: Search for applications
    Given I am on the applications page
    And there are multiple applications available
    When I search for "Test"
    Then I should see only applications containing "Test" in their name
    And the search results should be highlighted

  Scenario: Delete an application
    Given I am on the applications page
    And there is an application named "Test Application"
    When I click the delete button for "Test Application"
    And I confirm the deletion
    Then the application should be removed from the list
    And I should see a success message

  Scenario Outline: Filter applications by status
    Given I am on the applications page
    When I filter by status "<status>"
    Then I should see only applications with status "<status>"

    Examples:
      | status    |
      | Draft     |
      | Published |
      | Archived  |
```

## Step Definitions

### Step Definition Patterns

```javascript
// ✅ Step definitions (tests/steps/applications.steps.js)
import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { ApplicationsPage } from '../page_object/ApplicationsPage.js';

let applicationsPage;

Given('I am on the applications page', async function () {
  applicationsPage = new ApplicationsPage(this.page);
  await applicationsPage.navigateToApplications(this.projectId);
  await applicationsPage.waitForApplicationsToLoad();
});

When('I click the create application button', async function () {
  await applicationsPage.createNewApplication();
});

When('I fill in the application form with:', async function (dataTable) {
  const formData = dataTable.rowsHash();

  for (const [field, value] of Object.entries(formData)) {
    const selector = `[data-testid="${field.toLowerCase()}-input"]`;
    await this.page.locator(selector).fill(value);
  }
});

When('I search for {string}', async function (searchTerm) {
  await applicationsPage.searchApplications(searchTerm);
  // Store search term for later verification
  this.lastSearchTerm = searchTerm;
});

Then('I should see the new application in the list', async function () {
  const applicationCount = await applicationsPage.getApplicationCount();
  expect(applicationCount).toBeGreaterThan(0);

  // Verify the specific application exists
  const applicationNames = await applicationsPage.getApplicationNames();
  expect(applicationNames).toContain('Test Application');
});

Then('I should see only applications containing {string} in their name', async function (searchTerm) {
  const applicationNames = await applicationsPage.getApplicationNames();

  for (const name of applicationNames) {
    expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
  }
});
```

## Test Data Management

### Memory/State Management

```javascript
// ✅ Test memory pattern (tests/memory/TestMemory.js)
export class TestMemory {
  constructor() {
    this.testData = new Map();
    this.createdEntities = [];
  }

  store(key, value) {
    this.testData.set(key, value);
  }

  retrieve(key) {
    return this.testData.get(key);
  }

  addCreatedEntity(type, id, data) {
    this.createdEntities.push({ type, id, data, createdAt: new Date() });
  }

  getCreatedEntities(type) {
    return this.createdEntities.filter(entity => entity.type === type);
  }

  clear() {
    this.testData.clear();
    this.createdEntities = [];
  }

  // Cleanup helper for teardown
  async cleanup(apiClient) {
    for (const entity of this.createdEntities) {
      try {
        await apiClient.delete(`/${entity.type}s/${entity.id}`);
      } catch (error) {
        console.warn(`Failed to cleanup ${entity.type} ${entity.id}:`, error.message);
      }
    }
    this.clear();
  }
}
```

### Hooks and Setup

```javascript
// ✅ Test hooks (tests/steps/hooks.js)
import { After, AfterAll, Before, BeforeAll } from '@cucumber/cucumber';

import { TestMemory } from '../memory/TestMemory.js';

let testMemory;

BeforeAll(async function () {
  // Global setup
  console.log('Starting test suite...');
});

Before(async function (scenario) {
  // Initialize test memory for each scenario
  testMemory = new TestMemory();
  this.testMemory = testMemory;

  // Set default project ID
  this.projectId = process.env.TEST_PROJECT_ID || '1';

  // Browser setup is handled by Playwright
  console.log(`Starting scenario: ${scenario.pickle.name}`);
});

After(async function (scenario) {
  // Cleanup created test data
  if (this.apiClient && testMemory) {
    await testMemory.cleanup(this.apiClient);
  }

  if (scenario.result.status === 'FAILED') {
    // Take screenshot on failure
    const screenshot = await this.page.screenshot();
    this.attach(screenshot, 'image/png');
  }

  console.log(`Completed scenario: ${scenario.pickle.name} - ${scenario.result.status}`);
});

AfterAll(async function () {
  console.log('Test suite completed');
});
```

## Component Testing Standards

### Test Data Attributes

Always add `data-testid` attributes to components for reliable test selectors:

```jsx
// ✅ Component with test IDs
const ApplicationCard = ({ application, onEdit, onDelete }) => (
  <Card data-testid="application-card">
    <CardHeader>
      <Typography data-testid="application-name">{application.name}</Typography>
      <Box data-testid="application-status">{application.status}</Box>
    </CardHeader>
    <CardActions>
      <Button
        data-testid="edit-button"
        onClick={() => onEdit(application.id)}
      >
        Edit
      </Button>
      <Button
        data-testid="delete-button"
        onClick={() => onDelete(application.id)}
      >
        Delete
      </Button>
    </CardActions>
  </Card>
);
```

### Loading States Testing

```javascript
// ✅ Test loading states
When('I wait for the page to load', async function () {
  // Wait for loading indicator to appear and disappear
  await this.page.locator('[data-testid="loading-indicator"]').waitFor();
  await this.page.locator('[data-testid="loading-indicator"]').waitFor({ state: 'hidden' });
});

Then('I should see a loading indicator', async function () {
  await expect(this.page.locator('[data-testid="loading-indicator"]')).toBeVisible();
});
```

## API Testing Integration

### API State Verification

```javascript
// ✅ Verify API state in tests
Then('the application should be saved in the backend', async function () {
  // Verify through API call
  const response = await this.apiClient.get(`/applications/${this.createdApplicationId}`);
  expect(response.status).toBe(200);
  expect(response.data.name).toBe('Test Application');
});

When('I create an application via API', async function () {
  const applicationData = {
    name: 'API Created Application',
    description: 'Created via API for testing',
    project_id: this.projectId,
  };

  const response = await this.apiClient.post('/applications', applicationData);
  this.createdApplicationId = response.data.id;
  this.testMemory.addCreatedEntity('application', response.data.id, response.data);
});
```

## Test Environment Configuration

### Environment-Specific Configs

```javascript
// ✅ Environment configuration (tests/cucumber.ts)
const config = {
  // Development environment
  development: {
    baseURL: 'http://localhost:5173',
    timeout: 10000,
    slowMo: 100, // Slow down for debugging
  },

  // CI environment
  ci: {
    baseURL: process.env.TEST_BASE_URL,
    timeout: 30000,
    headless: true,
    video: 'retain-on-failure',
  },

  // Production-like testing
  staging: {
    baseURL: process.env.STAGING_URL,
    timeout: 15000,
    authentication: true,
  },
};

export default config[process.env.TEST_ENV || 'development'];
```

## Error Handling in Tests

### Robust Error Handling

```javascript
// ✅ Error handling patterns
async function safeClick(page, selector, timeout = 5000) {
  try {
    await page.locator(selector).waitFor({ timeout });
    await page.locator(selector).click();
  } catch (error) {
    // Take screenshot for debugging
    const screenshot = await page.screenshot();
    console.error(`Failed to click ${selector}:`, error.message);
    throw new Error(`Element ${selector} not clickable: ${error.message}`);
  }
}

async function waitForApiResponse(page, urlPattern, timeout = 10000) {
  return page.waitForResponse(response => response.url().match(urlPattern) && response.status() === 200, {
    timeout,
  });
}
```

## Test Reporting and Debugging

### Debug Helpers

```javascript
// ✅ Debug utilities
export class DebugHelper {
  static async takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  static async logPageErrors(page) {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });
  }

  static async dumpPageState(page) {
    const url = page.url();
    const title = await page.title();
    const loadState = await page.evaluate(() => document.readyState);

    console.log('Page state:', { url, title, loadState });
  }
}
```

## Performance Testing

### Performance Assertions

```javascript
// ✅ Performance testing patterns
Then('the page should load within {int} seconds', async function (maxSeconds) {
  const startTime = Date.now();
  await this.page.waitForLoadState('networkidle');
  const loadTime = (Date.now() - startTime) / 1000;

  expect(loadTime).toBeLessThan(maxSeconds);
});

When('I measure the API response time', async function () {
  const startTime = Date.now();
  const response = await this.page.waitForResponse('/api/applications');
  const responseTime = Date.now() - startTime;

  this.testMemory.store('lastApiResponseTime', responseTime);
  expect(responseTime).toBeLessThan(2000); // 2 second max
});
```

## Accessibility Testing

### A11y Verification

```javascript
// ✅ Accessibility testing
import { checkA11y, injectAxe } from 'axe-playwright';

Before(async function () {
  await injectAxe(this.page);
});

Then('the page should be accessible', async function () {
  await checkA11y(this.page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});

Then('the form should be keyboard navigable', async function () {
  // Test tab navigation
  await this.page.keyboard.press('Tab');
  const focusedElement = await this.page.evaluate(() => document.activeElement.tagName);
  expect(['INPUT', 'BUTTON', 'SELECT']).toContain(focusedElement);
});
```

Remember: Write tests that are maintainable, readable, and closely mirror real user behavior. Use the Page
Object Model to keep tests DRY and easy to update when the UI changes.
