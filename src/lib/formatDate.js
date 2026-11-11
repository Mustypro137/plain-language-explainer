const format = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export const formatDate = (iso) => format.format(new Date(iso))
