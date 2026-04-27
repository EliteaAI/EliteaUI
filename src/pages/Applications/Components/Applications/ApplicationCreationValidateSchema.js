import * as yup from 'yup';

const ApplicationCreationValidateSchema = () => {
  return yup.object({
    name: yup.string('Enter agent name').required('Name is required'),
    description: yup.string('Enter agent description').required('Description is required'),
  });
};

export default ApplicationCreationValidateSchema;
