import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task, Status } from './types'
import { getTasks } from './api/client'
import { Column } from './components/Column'

const COLUMNS: { status: Status; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export default function Board() {
  // tasks를 가져오는 요청을 실행하기 전과 진짜 tasks가 빈배열인 경우를 구별하기 위해 초기값으로 undefined를 사용
  const [tasks, setTasks] = useState<Task[] | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  // ApiError가 Error타입을 기반으로 에러를 던지기 때문에 Error를 타입으로 지정
  const [error, setError] = useState<Error | null>(null)

  // task를 가져오는 함수는 변경이 되지 않는 함수이기 때문에 useCallback으로 최적화
  const fetchTask = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getTasks()
      setTasks(data)
    } catch (error: unknown) {
      // 에러 객체의 타입을 Error로 맞추기
      if (error instanceof Error) setError(error)
      else setError(new Error(String(Error)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTask()
  }, [])

  // ⚠️ 서버에 저장하지 않고 로컬 상태만 바꾸는 "순진한" 이동입니다.
  // TODO(P1): 낙관적 업데이트 + 실패 시 롤백 + 경쟁 상태 처리를 구현하세요.
  //   - updateTask(id, { status, version }) 로 서버에 반영
  //   - 실패(15%)하면 이전 상태로 되돌리고 사용자에게 알림
  //   - 같은 카드를 빠르게 연속 이동해도 최종 상태가 서버와 일치하도록
  const moveTask = (id: string, status: Status) => {
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const byStatus = useMemo(() => {
    // if (!tasks) return;
    // 위 처럼 맨 위에서 방어하지 않는 이유는 byStatus의 리턴타입을 Record<Status, Task[]>로 고정하기 위해
    const map: Record<Status, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    }

    // tasks를 undefined로 초기화시켰기 때문에 방어코드 추가
    if (!tasks) return map
    for (const t of tasks) map[t.status].push(t)
    return map
  }, [tasks])

  if (loading) return <p className="hint">불러오는 중…</p>

  if (error)
    return (
      <>
        <p className="hint">{error.message}</p>
        <button onClick={fetchTask}>재시도</button>
      </>
    )

  if (tasks && tasks.length === 0) return <p className="hint">빈 상태</p>

  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <Column
          key={col.status}
          title={col.title}
          status={col.status}
          tasks={byStatus[col.status]}
          onMove={moveTask}
        />
      ))}
    </div>
  )
}
