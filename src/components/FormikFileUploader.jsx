import { useCallback } from 'react';

import { useField, useFormikContext as useFormicContext } from 'formik';

import FileUploadControl from './FileUploadControl';

export default function FormikFileUploadControl({ name, id, ...props }) {
  const [field, meta, helpers] = useField(name);
  const { submitCount } = useFormicContext();

  const handleChange = useCallback(
    file => {
      helpers.setValue(file);
    },
    [helpers],
  );
  return (
    <FileUploadControl
      {...props}
      file={field.value}
      onChangeFile={handleChange}
      // Show error text when there is an error
      helperText={(meta.touched || submitCount > 0) && meta.error ? meta.error : ''}
      // Apply error styling when there is an error
      error={(meta.touched || submitCount > 0) && !!meta.error}
      onClick={field.onBlur}
      formikId={id}
      formikName={name}
    />
  );
}
