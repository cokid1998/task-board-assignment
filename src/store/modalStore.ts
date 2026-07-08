import { create } from 'zustand'
import { type ReactNode } from 'react'

interface ModalStore {
  isModalOpen: boolean // 모달 열림 여부
  modalContent: ReactNode | null // overlay안에 있는 모달
  openModal: (modalContent: ReactNode) => void // 모달 여는 함수
  closeModal: () => void // 모달 닫는 함수
}

const modalStore = create<ModalStore>((set) => ({
  isModalOpen: false,
  modalContent: null,
  openModal: (modalContent) => {
    set({
      isModalOpen: true,
      modalContent,
    })
  },
  closeModal: () => {
    set({
      isModalOpen: false,
      modalContent: null,
    })
  },
}))

export default modalStore
