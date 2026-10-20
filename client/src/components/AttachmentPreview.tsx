import { useEffect, useRef, useState } from 'react'
import { apiBlobRequest } from '../api/client'

export function AttachmentPreview({ ticketId, attachmentId, name, onClose }: {
  ticketId: number
  attachmentId: number
  name: string
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    const controller = new AbortController()
    let objectUrl = ''
    apiBlobRequest(`/tickets/${ticketId}/attachments/${attachmentId}/preview`, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể xem ảnh.')
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      element.close()
    }
  }, [ticketId, attachmentId])

  return <dialog ref={dialog} className="attachment-preview" onCancel={onClose} aria-labelledby="preview-title">
    <header><h2 id="preview-title">{name}</h2><button type="button" autoFocus onClick={onClose}>Đóng</button></header>
    {error ? <p role="alert">{error}</p> : url
      ? <img src={url} alt={name} onError={() => setError('Không thể hiển thị ảnh này. Bạn có thể tải xuống để kiểm tra.')} />
      : <p role="status">Đang tải ảnh…</p>}
  </dialog>
}
