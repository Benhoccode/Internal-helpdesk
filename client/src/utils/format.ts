export function formatTicketId(id: number) {
  return `#TK-${String(id).padStart(4, '0')}`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function getInitials(fullName: string) {
  return fullName
    .split(' ')
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}
