import { memo } from 'react'
import type { Task } from '../types'
import modalStore from '../store/modalStore'
import CardDeleteModal from './modal/CardDeleteModal'

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const Card = memo(function Card({
  task,
  onDelete,
}: {
  task: Task
  onDelete: () => void
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
        onClick={() => {
          // 삭제 모달 여는 로직
          openModal(<CardDeleteModal task={task} onDelete={onDelete} />)
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
