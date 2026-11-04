export const TEST_PANEL_WIDTH = {
  MIN: 320,
  DEFAULT: 373,
  // Agents and Skills: the chat needs more room than the pipeline run panel
  CHAT_DEFAULT: 480,
  MAX_RATIO: 0.5,
};

export const TEST_PANEL_STORAGE_KEYS = {
  pipeline: 'pipelineTestPanelWidth',
  // Shared by Agents and Skills, so both open at the same width
  chat: 'chatTestPanelWidth',
};

// Same grip image as the legacy react-split gutter of the pipeline editor
export const RESIZE_GRIP_IMAGE =
  "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==')";
