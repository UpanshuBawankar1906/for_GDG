import { useCallback, useRef } from 'react'

/**
 * Drag handle between two panels.
 * onDrag(dx) is called with the pixel delta on every mousemove.
 */
export default function DragHandle({ onDrag, vertical = false }) {
  const dragging = useRef(false)
  const last = useRef(0)

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    last.current = vertical ? e.clientY : e.clientX
    document.body.classList.add('dragging')

    const onMove = (e) => {
      if (!dragging.current) return
      const pos = vertical ? e.clientY : e.clientX
      onDrag(pos - last.current)
      last.current = pos
    }

    const onUp = () => {
      dragging.current = false
      document.body.classList.remove('dragging')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onDrag, vertical])

  return (
    <div
      onMouseDown={onMouseDown}
      className="shrink-0 group flex items-center justify-center"
      style={{
        width: vertical ? '100%' : '8px',
        height: vertical ? '8px' : '100%',
        cursor: vertical ? 'row-resize' : 'col-resize',
        background: 'transparent',
        zIndex: 10,
      }}
    >
      {/* Visual divider line */}
      <div
        className="group-hover:bg-[#4285f4] group-active:bg-[#4285f4] transition-colors"
        style={{
          width: vertical ? '40px' : '2px',
          height: vertical ? '2px' : '40px',
          background: '#e8eaed',
          borderRadius: '99px',
        }}
      />
    </div>
  )
}
