'use client'

import { useCallback, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Bucket = 'property-images' | 'lease-documents'

interface FileUploaderProps {
  bucket: Bucket
  accept: 'image/*' | '.pdf'
  maxSize: number // bytes
  onUpload: (url: string, path: string) => void
  onError?: (message: string) => void
  /** Optional lease ID — prepended to filename for RLS path matching */
  leaseId?: string
  disabled?: boolean
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  message: string
  url?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file: File, accept: FileUploaderProps['accept'], maxSize: number): string | null {
  if (accept === 'image/*' && !file.type.startsWith('image/')) {
    return 'Only image files accepted'
  }
  if (accept === '.pdf' && file.type !== 'application/pdf') {
    return 'Only PDF files accepted'
  }
  if (file.size > maxSize) {
    return `File too large. Max size: ${formatBytes(maxSize)}`
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FileUploader({
  bucket,
  accept,
  maxSize,
  onUpload,
  onError,
  leaseId,
  disabled = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  })

  const upload = useCallback(
    async (file: File) => {
      const validationError = validateFile(file, accept, maxSize)
      if (validationError) {
        setState({ status: 'error', progress: 0, message: validationError })
        onError?.(validationError)
        return
      }

      setState({ status: 'uploading', progress: 0, message: `Uploading ${file.name}…` })

      const formData = new FormData()
      formData.append('bucket', bucket)
      // For lease-documents, prefix path with leaseId for RLS matching
      const renamedFile =
        leaseId && bucket === 'lease-documents'
          ? new File([file], `${leaseId}/${file.name}`, { type: file.type })
          : file
      formData.append('file', renamedFile)

      // Simulate progress with XMLHttpRequest so we get real upload events
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90) // cap at 90 until server responds
            setState((prev) => ({ ...prev, progress: pct }))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as { url: string; path: string }
              setState({ status: 'success', progress: 100, message: 'Upload complete', url: data.url })
              onUpload(data.url, data.path)
              resolve()
            } catch {
              reject(new Error('Invalid server response'))
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText) as { error: string }
              reject(new Error(data.error ?? 'Upload failed'))
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      }).catch((err: Error) => {
        setState({ status: 'error', progress: 0, message: err.message })
        onError?.(err.message)
      })
    },
    [accept, bucket, leaseId, maxSize, onError, onUpload],
  )

  // ── Event handlers ──────────────────────────────────────────────────────────

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled || state.status === 'uploading') return
    upload(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }

  const handleReset = () => {
    setState({ status: 'idle', progress: 0, message: '' })
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const isUploading = state.status === 'uploading'
  const isSuccess = state.status === 'success'
  const isError = state.status === 'error'
  const isInteractive = !disabled && !isUploading

  return (
    <div className="file-uploader" data-status={state.status}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label="File upload area"
        aria-disabled={disabled || isUploading}
        className={[
          'drop-zone',
          isDragOver ? 'drop-zone--active' : '',
          isSuccess ? 'drop-zone--success' : '',
          isError ? 'drop-zone--error' : '',
          disabled ? 'drop-zone--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => isInteractive && inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && isInteractive && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled || isUploading}
        />

        {/* Icon */}
        <div className="drop-zone__icon" aria-hidden>
          {isSuccess ? '✓' : isError ? '✕' : isUploading ? '↑' : '↑'}
        </div>

        {/* Text */}
        <div className="drop-zone__text">
          {isUploading && <span>Uploading… {state.progress}%</span>}
          {isSuccess && <span>Uploaded successfully</span>}
          {isError && <span>{state.message}</span>}
          {state.status === 'idle' && (
            <>
              <span className="drop-zone__primary">
                Drop {accept === '.pdf' ? 'PDF' : 'image'} here or click to browse
              </span>
              <span className="drop-zone__secondary">
                Max {formatBytes(maxSize)}
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {isUploading && (
          <div className="progress-bar" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-bar__fill" style={{ width: `${state.progress}%` }} />
          </div>
        )}
      </div>

      {/* Actions */}
      {(isSuccess || isError) && (
        <button type="button" className="reset-btn" onClick={handleReset}>
          Upload another file
        </button>
      )}

      <style>{css}</style>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = /* css */`
.file-uploader {
  --color-border: #d1d5db;
  --color-border-active: #6366f1;
  --color-bg: #fafafa;
  --color-bg-active: #eef2ff;
  --color-bg-success: #f0fdf4;
  --color-bg-error: #fff1f2;
  --color-border-success: #22c55e;
  --color-border-error: #f43f5e;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-accent: #6366f1;
  --color-success: #16a34a;
  --color-error: #e11d48;
  --radius: 12px;
  font-family: system-ui, sans-serif;
}

.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 24px;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  outline: none;
  text-align: center;
  min-height: 180px;
}

.drop-zone:focus-visible {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
}

.drop-zone--active {
  border-color: var(--color-border-active);
  background: var(--color-bg-active);
}

.drop-zone--success {
  border-color: var(--color-border-success);
  background: var(--color-bg-success);
  cursor: default;
}

.drop-zone--error {
  border-color: var(--color-border-error);
  background: var(--color-bg-error);
  cursor: default;
}

.drop-zone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drop-zone__icon {
  font-size: 2rem;
  line-height: 1;
  color: var(--color-accent);
}

.drop-zone--success .drop-zone__icon { color: var(--color-success); }
.drop-zone--error .drop-zone__icon   { color: var(--color-error); }

.drop-zone__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.drop-zone__primary {
  font-weight: 500;
}

.drop-zone__secondary {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #e5e7eb;
  border-radius: 0 0 var(--radius) var(--radius);
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--color-accent);
  transition: width 0.2s ease;
}

.reset-btn {
  margin-top: 10px;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: white;
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.reset-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
`