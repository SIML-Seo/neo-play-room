interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function Loader({ size = 'md', text }: LoaderProps) {
  const sizeStyles = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${sizeStyles[size]}
          border-primary border-t-transparent
          rounded-full
          animate-spin
        `}
      />
      {text && <p className="text-gray-600 animate-pulse">{text}</p>}
    </div>
  )
}
