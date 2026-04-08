import * as yup from 'yup';

const ApplicationCreationValidateSchema = () => {
  return yup.object({
    name: yup.string('Enter agent name').required('Name is required'),
    description: yup.string('Enter agent description').required('Description is required'),
    version_details: yup.object({
      conversation_starters: yup
        .array()
        .of(
          yup
            .string()
            .test(
              'not-empty-or-whitespace',
              'Conversation starter cannot be empty',
              value => value === undefined || value === null || value.trim().length > 0,
            ),
        ),
    }),
  });
};

export default ApplicationCreationValidateSchema;
