# Testing

## Tests implementation notes:

- Tests are located in folder `tests`
- Tests have to be written using qavajs framework,
- Created feature files should be placed in folder `tests/features`.
- New tests implementation flow: create feature file with scenarios -> implement steps if needed (in folder
  `tests/steps`) -> run tests and fix issues if any.
- Always remember to open required page in the beginning of scenario (e.g. `Given I open '$url' url`),
  otherwise tests will fail.
- Use existing steps as much as possible, before creating new ones.
- Other tests implementation notes are in file `tests/AGENTS.md`

## Tests execution (all tests):

```bash
npm run test
```

just some of them (e.g.filter by grep pattern - name):

```bash
npm test -- --grep "Verify that user is able to login with valid credentials"
```

execution of specific feature file:

```bash
npm test -- --spec `tests/features/Authorization.feature`
```

# Development

## Features implementation notes:

- example of tool's properties description models (for tool `appendData`):

```json
{
  "args_schemas": {
    "appendData": {
      "properties": {
        "filename": {
          "description": "Filename",
          "title": "Filename",
          "type": "string"
        },
        "filedata": {
          "description": "Stringified content to append",
          "title": "Filedata",
          "type": "string"
        },
        "bucket_name": {
          "anyOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ],
          "default": null,
          "description": "Name of the bucket to work with. If bucket is not specified by user directly, the name should be taken from chat history. If bucket never mentioned in chat, the name will be taken from tool configuration. ***IMPORTANT*** Underscore \\_ is prohibited in bucket name and should be replaced by `-`",
          "title": "Bucket Name"
        }
      },
      "required": ["filename", "filedata"],
      "title": "appendData",
      "type": "object"
    }
  }
}
```
