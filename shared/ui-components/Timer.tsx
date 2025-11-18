interface TimerProps {
  timeLeft: number // seconds
  className?: string
}

export default function Timer({ timeLeft, className = '' }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = Math.floor(timeLeft % 60)

  const isWarning = timeLeft <= 10
  const isDanger = timeLeft <= 5

  return (
    <div
      className={`
        text-center font-mono text-2xl font-bold
        ${isDanger ? 'text-danger animate-pulse' : isWarning ? 'text-warning' : 'text-gray-700'}
        ${className}
      `}
    >
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}
