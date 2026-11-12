// "Help in my language": a translation kept next to the English, as { lang, ...fields }.
export const isHelp = (help, fields) =>
  help !== null &&
  typeof help === 'object' &&
  typeof help.lang === 'string' &&
  help.lang !== '' &&
  fields.every((f) => typeof help[f] === 'string')

// Stored data is checked on read: a missing translation is fine, a broken one is not.
export const isOptionalHelp = (help, fields) => help === undefined || isHelp(help, fields)
