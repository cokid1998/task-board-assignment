import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Task, Status } from './types'
import {
  ApiError,
  getTasks,
  updateTask,
  deleteTask,
  createTask,
} from './api/client'
import { Column } from './components/Column'
import { type PriorityFilter } from './App'
import { CreateTaskPayload } from './components/modal/CardCreateModal'

const COLUMNS: { status: Status; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
]

export default function Board({
  query,
  priorityFilter,
}: {
  query: string
  priorityFilter: PriorityFilter
}) {
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

  type MoveAttempt = { mutationId: number; original: Task }
  // 카드id별로 요청ID와 요청당시 카드의 데이터를 가지고 있는 ref
  const moveAttemptsRef = useRef<Map<string, MoveAttempt>>(new Map())
  // 요청ID
  const mutationCounterRef = useRef(0)

  const moveTask = async (id: string, status: Status) => {
    // 함수 실행당시 카드데이터
    const targetTask = tasks?.find((t) => t.id === id)
    if (!targetTask) return

    // 함수 실행당시 요청id생성 및 최신화
    const mutationId = ++mutationCounterRef.current
    // 이 카드에 대해 아직 끝나지 않고 진행 중인 시퀀스가 있는지 확인하는 변수
    const existing = moveAttemptsRef.current.get(id)
    // 첫 요청이면 함수 실행당시 카드데이터, 아니라면 기존 카드정보를 할당
    const original = existing ? existing.original : targetTask
    // 요청 정보를 ref에 저장
    moveAttemptsRef.current.set(id, { mutationId, original })

    // 낙관적 업데이트이기 때문에 UI는 무조건 업데이트
    setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, status } : t)))

    // 함수실행당시 요청이 최신 요청인지 확인하는 함수
    const isLatest = () =>
      moveAttemptsRef.current.get(id)?.mutationId === mutationId

    try {
      const updated = await updateTask(id, {
        status,
        version: targetTask.version,
      })

      // 응답을 받아왔을 때 낡은요청이면 그냥 리턴
      // await updateTask가 아직 응답을 받아오지 못했는데 동일한 카드를 옮기면 그냥 리턴
      if (!isLatest()) return

      // 유효한 최신 요청이면 UI변경 (version을 최신화)
      setTasks((prev) => prev?.map((t) => (t.id === id ? updated : t)))
      // 요청 관리 ref에서 삭제
      moveAttemptsRef.current.delete(id)
    } catch (error: unknown) {
      // catch에 첫 진입시 최신 요청인지 확인하고 최신요청이 아니라면 밑에 로직을 실행할 필요가 없기 때문에 종료
      if (!isLatest()) return

      if (error instanceof ApiError && error.status === 409) {
        // 2중 try/catch를 사용하여 409 재요청에 대한 에러를 처리할 수도 있지만
        // 이 경우 코드가 너무 복잡해지고, 발생빈도가 낮은 엣지케이스이기 때문에 배제
        // try {
        // } catch (error) {}

        const serverTask = (error.payload as { current: Task }).current
        const updated = await updateTask(id, {
          status,
          version: serverTask.version,
        })

        // 응답을 받아왔을 때 낡은요청이면 그냥 리턴
        if (!isLatest()) return

        setTasks((prev) => prev?.map((t) => (t.id === id ? updated : t)))
        moveAttemptsRef.current.delete(id)

        return
      }

      // 409가 아닌 나머지 에러
      const attempt = moveAttemptsRef.current.get(id)
      if (attempt) {
        setTasks((prev) =>
          prev?.map((t) => (t.id === id ? attempt.original : t)),
        )
      }
      moveAttemptsRef.current.delete(id)
      alert('이동이 서버 반영에 실패해서 롤백시킵니다.')
    }
  }

  const handleDeleteTask = async (id: string) => {
    // 에러시 원복을 위해 task의 순서와 task자체를 변수에 저장
    const targetTaskIndex = tasks?.findIndex((task) => task.id === id)
    const targetTask = tasks?.find((task) => task.id === id)

    if (targetTaskIndex === -1 || !targetTask) return // 이미 없는 태스크면 아무것도 안 함

    // UI는 성공 실패 상관없이 반영 (낙관적업데이트)
    setTasks((prev) => prev?.filter((task) => task.id !== id))

    try {
      await deleteTask(id)
    } catch {
      setTasks((prev) => {
        // 타입에러 방지용 코드
        if (!prev) return prev

        // targetTask를 원래 위치에 넣기
        const rollback = [
          ...prev.slice(0, targetTaskIndex),
          targetTask,
          ...prev.slice(targetTaskIndex),
        ]
        return rollback
      })
      alert('삭제가 서버 반영에 실패해서 복원시킵니다.')
    }
  }

  const handleCreateTask = async (form: CreateTaskPayload) => {
    const { title, priority, description, status } = form
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const tempTask: Task = {
      id: tempId,
      title,
      description,
      status,
      priority,
      createdAt: now,
      updatedAt: now,
      version: 0,
    }

    // 낙관적 업데이트
    setTasks((prev) => {
      // 타입에러 방어코드
      if (!prev) return prev
      return [tempTask, ...prev]
    })

    try {
      const created = await createTask(form)
      // 서버에서 진짜 생성돼서 응답으로온 데이터로 tasks변경
      setTasks((prev) =>
        prev?.map((task) => (task.id === tempId ? created : task)),
      )
    } catch {
      setTasks((prev) => prev?.filter((task) => task.id !== tempId))
      alert('테스크 생성이 서버 반영에 실패했습니다.')
    }
  }

  // 검색어에 맞는 Task필터링
  const filteredTasks = tasks?.filter((task) => {
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter
    // early Return을 통해 함수내에서 가장 무거운 연산인 includes작업을 최소화 시키도록 성능 최적화
    if (!matchesPriority) return false

    const matchesQuery = task.title.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
  })

  const byStatus = useMemo(() => {
    // if (!tasks) return;
    // 위 처럼 맨 위에서 방어하지 않는 이유는 byStatus의 리턴타입을 Record<Status, Task[]>로 고정하기 위해
    const map: Record<Status, Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    }

    // tasks를 undefined로 초기화시켰기 때문에 방어코드 추가
    if (!filteredTasks) return map
    for (const t of filteredTasks) map[t.status].push(t)
    return map
  }, [filteredTasks])

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
          onDelete={handleDeleteTask}
          onCreate={handleCreateTask}
        />
      ))}
    </div>
  )
}
