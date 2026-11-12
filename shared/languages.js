// "Help in my language": the languages the AI can add under the simple English.
// Used by the server (to check the request) and by the app (the menu), so both agree.
// `code` is the HTML lang value, `name` goes into the AI prompt, `label` is shown in the menu.
export const LANGUAGES = [
  { code: 'ar', name: 'Arabic', label: 'العربية (Arabic)' },
  { code: 'bn', name: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'zh-Hans', name: 'Simplified Chinese', label: '简体中文 (Chinese)' },
  { code: 'fr', name: 'French', label: 'Français (French)' },
  { code: 'de', name: 'German', label: 'Deutsch (German)' },
  { code: 'hi', name: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'id', name: 'Indonesian', label: 'Bahasa Indonesia (Indonesian)' },
  { code: 'it', name: 'Italian', label: 'Italiano (Italian)' },
  { code: 'ja', name: 'Japanese', label: '日本語 (Japanese)' },
  { code: 'ko', name: 'Korean', label: '한국어 (Korean)' },
  { code: 'fa', name: 'Persian', label: 'فارسی (Persian)' },
  { code: 'pl', name: 'Polish', label: 'Polski (Polish)' },
  { code: 'pt', name: 'Portuguese', label: 'Português (Portuguese)' },
  { code: 'ru', name: 'Russian', label: 'Русский (Russian)' },
  { code: 'es', name: 'Spanish', label: 'Español (Spanish)' },
  { code: 'sw', name: 'Swahili', label: 'Kiswahili (Swahili)' },
  { code: 'tr', name: 'Turkish', label: 'Türkçe (Turkish)' },
  { code: 'uk', name: 'Ukrainian', label: 'Українська (Ukrainian)' },
  { code: 'ur', name: 'Urdu', label: 'اردو (Urdu)' },
  { code: 'vi', name: 'Vietnamese', label: 'Tiếng Việt (Vietnamese)' },
]

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]))

export const findLanguage = (code) => (typeof code === 'string' && BY_CODE.get(code)) || null
