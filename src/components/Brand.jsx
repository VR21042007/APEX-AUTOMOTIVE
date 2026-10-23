export function ApexMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M5 41 20.9 7h6.2L43 41h-8.8l-2.6-6.1H16.4L13.8 41H5Zm13.6-13.2h4.6L20.9 20l-2.3 7.8Z" fill="currentColor" />
      <path d="M20.9 7h6.2l3.1 6.7h-4.8L20.9 7Z" fill="#FF5A1F" />
    </svg>
  )
}

export function Wordmark({ compact = false }) {
  return (
    <span className={`wordmark${compact ? ' wordmark--compact' : ''}`}>
      <ApexMark className="wordmark__mark" />
      <span className="wordmark__text">APEX</span>
      {!compact && <span className="wordmark__meta">AUTOMOTIVE</span>}
    </span>
  )
}
