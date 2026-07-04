import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Task, Status } from './types'
import { ApiError, getTasks, updateTask } from './api/client'
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
      console.log(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTask()
  }, [])

  // 사용자가 가장 최근에 Drop한 status를 저장하는 ref
  const lastReqTaskRef = useRef<Map<string, Status>>(new Map())

  const moveTask = async (id: string, status: Status) => {
    const targetTask = tasks?.find((t) => t.id === id)
    if (!targetTask) return

    lastReqTaskRef.current.set(id, status)

    const backupTasks = tasks
    // UI는 무조건 반영 (version이 반영이 안된 상태)
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, status } : t)))

    // 시나리오
    // Todo -> Progress -> Done 순서로 카드를 빠르게 움직였을 때
    // Progress(version 0), Done(version 0)의 네트워크 요청이 동시에 간다

    // Case 1. Progress(version 0)가 먼저 도착, 그러면 Done(version 0)은 409에러를 응답한다.
    // 먼저온 progress(version 0)의 응답은 처리 하지 않고
    // 나중에 오는 Done(version 0)의 409에러를 캐치해서 다시 요청한다

    // Case 2. Done(version 0)가 먼저 도착, 그러면 Progress(version 0)은 409에러를 응답한다.
    // 응답받은 Done(version 0)의 응답을 처리하고
    // 나중에 오는 Progress(version 0)의 응답은 무시한다

    try {
      const updated = await updateTask(id, {
        status,
        version: targetTask.version,
      })
      // 사용자가 가장 최근에 Drop한 status가 같지않으면 UI에 반영하지 않음
      if (lastReqTaskRef.current.get(id) !== status) return

      // version을 최신화 시킴
      setTasks((prev) => prev?.map((t) => (t.id === id ? updated : t)))
    } catch (error: unknown) {
      // 409에러 처리
      if (error instanceof ApiError && error.status === 409) {
        // 409가 일어날 당시 서버에 저장된 Task
        const serverTask = (error.payload as { current: Task }).current
        // 사용자의 마지막 status를 다시 요청
        const updated = await updateTask(id, {
          status: lastReqTaskRef.current.get(id),
          version: serverTask.version,
        })
        // version을 최신화 시킴
        setTasks((prev) => prev?.map((t) => (t.id === id ? updated : t)))
        return
      }
      // 409에러가 아닌 모든 에러 처리
      setTasks(backupTasks)
      alert('이동이 서버 반영에 실패해서 롤백시킵니다.')
    }
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
