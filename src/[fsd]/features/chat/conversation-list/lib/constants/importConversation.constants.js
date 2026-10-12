export const ENCRYPTED_FILE_SUFFIX = '.enc';

export const IMPORT_ACCEPTED_EXTENSIONS = ['.json.enc', '.zip.enc'];

export const IMPORT_CHUNK_SIZE = 5 * 1024 * 1024;

export const IMPORT_STEPS = {
  select: 'select',
  checking: 'checking',
  ready: 'ready',
  importing: 'importing',
};

export const IMPORT_MESSAGES = {
  unsupportedType:
    'Unsupported file type. Please select an encrypted .json.enc or .zip.enc file exported from ELITEA.',
  tooLarge: maxSize => `File is too large. Maximum size is ${maxSize}.`,
  checkFailed: 'Failed to check the file. Please try again.',
  success: name => `Chat "${name}" imported successfully`,
  partial: count => `Chat imported. ${count} attachment(s) could not be imported.`,
  failed: 'Import failed. Nothing was imported.',
};
