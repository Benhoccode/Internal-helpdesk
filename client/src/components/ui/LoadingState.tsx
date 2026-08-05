interface LoadingStateProps {
  readonly label?: string
}

export function LoadingState({
  label = 'Đang tải dữ liệu...',
}: Readonly<LoadingStateProps>) {
  return (
    <div className="state-message" role="status">
      <span className="spinner" />
      {label}
    </div>
  )
}
