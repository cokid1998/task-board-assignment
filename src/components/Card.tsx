import { memo } from 'react'
import type { Task } from '../types'
import modalStore from '../store/modalStore'
import CardDeleteModal from './modal/CardDeleteModal'
import CardEditModal, { type EditTaskPayload } from './modal/CardEditModal'

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const Card = memo(function Card({
  task,
  onDelete,
  onEdit,
}: {
  task: Task
  onDelete: (id: string) => void
  onEdit: (id: string, patch: EditTaskPayload) => void
}) {
  const openModal = modalStore((state) => state.openModal)
  return (
    <article
      className={`card priority-${task.priority}`}
      style={{ position: 'relative' }}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
    >
      <div className="card-title">{task.title}</div>
      <div className="card-meta">
        <span className={`badge badge-${task.priority}`}>
          {PRIORITY_LABEL[task.priority]}
        </span>
        <span className="date">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>

      <button
        style={{
          position: 'absolute',
          top: '4px',
          right: '28px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => {
          openModal(<CardEditModal task={task} onEdit={onEdit} />)
        }}
      >
        ✎
      </button>

      <button
        onClick={() => {
          // 삭제 모달 여는 로직
          openModal(
            <CardDeleteModal task={task} onDelete={() => onDelete(task.id)} />,
          )
        }}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </article>
  )
})
