export const getStringMaxLength = property =>
  property?.maxLength ?? property?.anyOf?.find(item => item.type === 'string')?.maxLength;
