import { useEffect, useRef } from 'react'
import { useOverlay } from '../hooks/useOverlay'

// A column that slides open and shut beside the chat (desktop).
export function InlineSlot({ open, width, children }) {
  return (
    <div
      style={{ width: open ? width : 0 }}
      aria-hidden={!open}
      className={`shrink-0 overflow-hidden transition-[width,visibility] duration-200 ease-out motion-reduce:transition-none ${
        open ? 'visible' : 'invisible'
      }`}
    >
      {/* Fixed inner width, so the content does not squash while the column animates. */}
      <div style={{ width }} className="h-full">
        {children}
      </div>
    </div>
  )
}

const CLOSE_DISTANCE = 110 // px dragged down
const CLOSE_SPEED = 0.6 // px per ms: a quick flick closes it too

// A drawer from the left or a sheet from the bottom, with a backdrop (phones).
export function Overlay({ open, onClose, side, label, children }) {
  const ref = useOverlay(open, onClose)
  const drag = useRef(null)
  const sheet = side === 'bottom'

  // Drop any drag offset once the sheet is closed, so it opens from the right place next time.
  useEffect(() => {
    if (!open && ref.current) ref.current.style.translate = ''
  }, [open, ref])

  function begin(event) {
    drag.current = { id: event.pointerId, startY: event.clientY, lastY: event.clientY, lastT: event.timeStamp, speed: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    ref.current.style.transition = 'none' // follow the finger, with no easing
  }

  function move(event) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    d.speed = (event.clientY - d.lastY) / Math.max(1, event.timeStamp - d.lastT)
    d.lastY = event.clientY
    d.lastT = event.timeStamp
    ref.current.style.translate = `0 ${Math.max(0, event.clientY - d.startY)}px`
  }

  function end(event) {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    const node = ref.current
    node.style.transition = ''
    const distance = Math.max(0, event.clientY - d.startY)
    if (event.type === 'pointerup' && (distance > CLOSE_DISTANCE || d.speed > CLOSE_SPEED)) {
      node.style.translate = '0 100%' // finish the slide down, then close
      onClose()
    } else {
      node.style.translate = '' // spring back
    }
  }

  const hidden = sheet ? 'translate-y-full' : '-translate-x-full'
  const place = sheet ? 'inset-x-0 bottom-0 max-h-[82dvh] rounded-t-3xl bg-sage' : 'inset-y-0 left-0 w-[min(86vw,320px)]'

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-40 transition-[visibility] duration-[250ms] ${open ? 'visible' : 'invisible'}`}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-pitch/50 transition-opacity duration-[250ms] motion-reduce:transition-none ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute ${place} flex flex-col overflow-hidden shadow-2xl transition-transform duration-[250ms] ease-out motion-reduce:transition-none ${
          open ? 'translate-x-0 translate-y-0' : hidden
        }`}
      >
        {sheet ? (
          // The drag surface owns every direction, so only the handle gets touch-action: none. The content scrolls normally.
          <div
            aria-hidden="true"
            onPointerDown={begin}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center bg-sage"
          >
            <span className="h-1.5 w-10 rounded-full bg-moss/40" />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}