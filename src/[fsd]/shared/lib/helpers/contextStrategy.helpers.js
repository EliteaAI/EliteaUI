export const handleConvertToNumberChange = (value, formikField, setFormikValue) => {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  const finalValue = digitsOnly !== '' ? Number(digitsOnly) : '';
  setFormikValue(formikField, finalValue);
};
