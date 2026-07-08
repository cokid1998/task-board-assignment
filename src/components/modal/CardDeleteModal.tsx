import { type Task } from '../../types'
import modalStore from '../../store/modalStore'

export default function CardDeleteModal({
  task,
  onDelete,
}: {
  task: Task
  onDelete: () => void
}) {
  const closeModal = modalStore((state) => state.closeModal)

  const handleDelete = () => {
    onDelete()
    closeModal()
  }

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <p>{task.title}를 삭제하시겠습니까?</p>
      <button onClick={handleDelete}>확인</button>
      <button onClick={closeModal}>취소</button>
    </div>
  )
}
