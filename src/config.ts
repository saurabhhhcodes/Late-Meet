// Shared Configuration Constants for Late Meet

export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
export const ELEVENLABS_STT_MODEL = "scribe_v2";
export const WHISPER_MODEL = "whisper-1";

// Vite replaces import.meta.env.DEV at build time, so production builds cannot
// accidentally ship verbose debug logging by flipping a committed constant.
export const DEBUG = import.meta.env.DEV === true;
