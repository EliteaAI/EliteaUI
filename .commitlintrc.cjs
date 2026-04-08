module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-function-rules'],
  rules: {
    'scope-enum': [0],
    'subject-empty': [0],
    'function-rules/subject-empty': [
      2,
      'always',
      ({ subject }) => {
        if (!subject) {
          return [false, `subject should start with a colon - ": <subject>"`];
        }
        if (!subject?.match(/^\[EL-[0-9]+\] .+/)?.length) {
          return [false, `subject must container ticket number - [EL-XXXX]`];
        }
        if (subject.replace(/^\[EL-[0-9]+\] /, '').length < 15) {
          return [false, `subject must have at least 15 characters`];
        }
        return [true];
      },
    ],
  },
};
