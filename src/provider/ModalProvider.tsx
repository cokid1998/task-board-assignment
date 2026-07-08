import { ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import modalStore from '../store/modalStore'

function Modal() {
  const modalContent = modalStore((state) => state.modalContent)
  const closeModal = modalStore((state) => state.closeModal)
  const overlayRef = useRef<HTMLDivElement>(null)

  // esc 누르면 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleEsc)

    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [])

  // overlay영역을 클릭하면 모달을 닫기
  useEffect(() => {
    const handleClickOverlay = (e: MouseEvent) => {
      if (e.target === overlayRef.current) {
        closeModal()
      }
    }

    document.addEventListener('mousedown', handleClickOverlay)

    return () => document.removeEventListener('mousedown', handleClickOverlay)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      ref={overlayRef}
    >
      {modalContent}
    </div>
  )
}

export default function ModalProvider({ children }: { children: ReactNode }) {
  const isModalOpen = modalStore((state) => state.isModalOpen)

  return (
    <>
      {isModalOpen && createPortal(<Modal />, document.body)}
      {children}
    </>
  )
}
