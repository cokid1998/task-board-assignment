import modalStore from '../store/modalStore'
import type { Task, Status } from '../types'
import { Card } from './Card'
import CardCreateModal from './modal/CardCreateModal'
import { type CreateTaskPayload } from './modal/CardCreateModal'
import { EditTaskPayload } from './modal/CardEditModal'

interface Props {
  title: string
  status: Status
  tasks: Task[]
  onMove: (id: string, status: Status) => void
  onDelete: (id: string) => void
  onCreate: (form: CreateTaskPayload) => void
  onEdit: (id: string, form: EditTaskPayload) => void
}

export function Column({
  title,
  status,
  tasks,
  onMove,
  onDelete,
  onCreate,
  onEdit,
}: Props) {
  const openModal = modalStore((state) => state.openModal)

  return (
    <section
      className="column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = e.dataTransfer.getData('text/plain')
        if (id) onMove(id, status)
      }}
    >
      <h2 className="column-title">
        {title} <span className="count">{tasks.length}</span>
        <button
          onClick={() =>
            openModal(<CardCreateModal status={status} onCreate={onCreate} />)
          }
          style={{
            background: 'white',
            border: '1px solid #dfe1e6',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          + 추가
        </button>
      </h2>
      <div className="column-body">
        {/* ⚠️ 5,000개를 그대로 렌더합니다. 대량 데이터 성능 최적화는 당신의 몫입니다. */}
        {tasks.map((t) => (
          <Card key={t.id} task={t} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </section>
  )
}
