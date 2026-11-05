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

// A drawer from the left or a sheet from the bottom, with a backdrop (phones).
export function Overlay({ open, onClose, side, label, children }) {
  const ref = useOverlay(open, onClose)
  const hidden = side === 'left' ? '-translate-x-full' : 'translate-y-full'
  const place =
    side === 'left' ? 'inset-y-0 left-0 w-[min(86vw,320px)]' : 'inset-x-0 bottom-0 max-h-[82dvh] rounded-t-3xl'

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
        {children}
      </div>
    </div>
  )
}