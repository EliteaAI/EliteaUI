import { CodeExamplesConstants } from '@/[fsd]/features/settings/lib/constants';

const { CODE_EXAMPLE_TYPES } = CodeExamplesConstants;

export const getFileNameForLanguage = language => {
  switch (language) {
    case CODE_EXAMPLE_TYPES.CURL:
      return 'api_example.sh';
    case CODE_EXAMPLE_TYPES.NODEJS:
      return 'api_example.js';
    case CODE_EXAMPLE_TYPES.PYTHON:
      return 'api_example.py';
    default:
      return 'api_example.txt';
  }
};

export const getEditorLanguage = codeType => {
  switch (codeType) {
    case CODE_EXAMPLE_TYPES.CURL:
      return 'bash';
    case CODE_EXAMPLE_TYPES.NODEJS:
      return 'javascript';
    case CODE_EXAMPLE_TYPES.PYTHON:
      return 'python';
    default:
      return 'text';
  }
};

export const generateCurlExample = (apiUrl, modelName, authToken, projectId) => {
  const projectHeader = projectId ? `  -H "OpenAI-Project: ${projectId}" \\` : '';

  return `curl ${apiUrl}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${authToken}" \\${
    projectHeader
      ? `
${projectHeader}`
      : ''
  }
  -d '{
    "model": "${modelName}",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant."
      },
      {
        "role": "user",
        "content": "Write a haiku about recursion in programming."
      }
    ]
  }'`;
};

export const generateNodejsExample = (apiUrl, modelName, authToken, projectId) => {
  const projectParam = projectId
    ? `,
  project: '${projectId}'`
    : '';

  return `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: '${authToken}',
  baseURL: '${apiUrl}'${projectParam}
});

async function main() {
  const completion = await client.chat.completions.create({
    model: '${modelName}',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: 'Write a haiku about recursion in programming.'
      }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`;
};

export const generatePythonExample = (apiUrl, modelName, authToken, projectId) => {
  const projectParam = projectId
    ? `,
    project="${projectId}"`
    : '';

  return `from openai import OpenAI

client = OpenAI(
    api_key="${authToken}",
    base_url="${apiUrl}"${projectParam}
)

completion = client.chat.completions.create(
    model="${modelName}",
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Write a haiku about recursion in programming."
        }
    ],
)

print(completion.choices[0].message.content)`;
};

/**
 * Generate code example based on language
 */
export const generateCodeExample = (language, apiUrl, modelName, authToken, projectId) => {
  switch (language) {
    case CODE_EXAMPLE_TYPES.CURL:
      return generateCurlExample(apiUrl, modelName, authToken, projectId);
    case CODE_EXAMPLE_TYPES.NODEJS:
      return generateNodejsExample(apiUrl, modelName, authToken, projectId);
    case CODE_EXAMPLE_TYPES.PYTHON:
      return generatePythonExample(apiUrl, modelName, authToken, projectId);
    default:
      return `# No example available for language: ${language}`;
  }
};

export const generateCanvasTitle = (integrationName, modelName) => {
  if (!integrationName || !modelName) {
    return 'Code Examples';
  }
  return `${integrationName} • ${modelName}`;
};
