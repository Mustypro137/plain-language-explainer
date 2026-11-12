import { lastSevenDays, streakLength } from '../lib/activityStore.js'
import { toDate } from '../lib/days.js'

const SHORT = new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' })
const LONG = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })

// Days in a row with a finished practice round, and the last seven days as a strip.
// It encourages without blaming: a missed day is just an empty square.
export default function Streak({ days, today }) {
  const streak = streakLength(days, today)
  const week = lastSevenDays(days, today)
  const doneToday = week.at(-1).practised
  const inWeek = week.filter((d) => d.practised).length

  let note = 'Finish a practice round to start one.'
  if (streak > 0) note = doneToday ? 'You practised today.' : 'One round today makes it longer.'

  return (
    <section className="card streak" aria-labelledby="streak-title">
      <div className="streak-text">
        <h2 id="streak-title" className="streak-title">
          {streak === 0 ? 'No streak yet' : `${streak}-day streak`}
        </h2>
        <p className="soft">{note}</p>
      </div>
      <ol className="week" aria-label={`Practised on ${inWeek} of the last 7 days`}>
        {week.map(({ day, practised, isToday }) => {
          const date = toDate(day)
          return (
            <li key={day} className={`week-day${practised ? ' week-day-on' : ''}${isToday ? ' week-day-today' : ''}`}>
              <span className="week-box" aria-hidden="true" />
              <span aria-hidden="true">{SHORT.format(date)}</span>
              <span className="visually-hidden">
                {isToday ? 'Today' : LONG.format(date)}: {practised ? 'practised' : 'no round'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
