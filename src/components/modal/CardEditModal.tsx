import { useState } from 'react'
import { type Task, type Priority, type Status } from '../../types'
import modalStore from '../../store/modalStore'

export interface EditTaskPayload {
  title: string
  priority: Priority
  description: string
  status: Status
}

interface FormType {
  title: string
  priority: Priority
  description: string
  status: Status
}

export default function CardEditModal({
  task,
  onEdit,
}: {
  task: Task
  onEdit: (id: string, form: EditTaskPayload) => void
}) {
  const closeModal = modalStore((state) => state.closeModal)

  // 기존 태스크 값으로 초기화
  const [form, setForm] = useState<FormType>({
    title: task.title,
    priority: task.priority,
    description: task.description ?? '',
    status: task.status,
  })

  const handleUpdateField = <K extends keyof FormType>(
    key: K,
    value: FormType[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    onEdit(task.id, form)
    closeModal()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'white',
        padding: '28px',
        borderRadius: '10px',
        width: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '18px' }}>태스크 수정</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
          제목 <span style={{ color: '#de350b' }}>*</span>
        </label>
        <input
          value={form.title}
          onChange={(e) => handleUpdateField('title', e.target.value)}
          placeholder="태스크 제목을 입력하세요"
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #dfe1e6',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
            우선순위 <span style={{ color: '#de350b' }}>*</span>
          </label>
          <select
            value={form.priority}
            onChange={(e) =>
              handleUpdateField('priority', e.target.value as Priority)
            }
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #dfe1e6',
              fontSize: '14px',
            }}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
            상태
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              handleUpdateField('status', e.target.value as Status)
            }
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #dfe1e6',
              fontSize: '14px',
            }}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
          설명
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleUpdateField('description', e.target.value)}
          placeholder="설명을 입력하세요 (선택)"
          rows={3}
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #dfe1e6',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        <button
          type="button"
          onClick={closeModal}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #dfe1e6',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          취소
        </button>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#0052cc',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          저장
        </button>
      </div>
    </form>
  )
}
