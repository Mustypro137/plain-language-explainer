// "Help in my language": the translation, smaller, under the English it belongs to.
// `lang` lets screen readers switch voice; `dir="auto"` lays out Arabic, Persian and Urdu right to left.
export default function HelpLine({ help, field }) {
  if (!help?.[field]) return null
  return (
    <p className="help-line" lang={help.lang} dir="auto">
      {help[field]}
    </p>
  )
}
