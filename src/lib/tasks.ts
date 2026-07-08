import type { Task, Status, Priority } from '../types'

export type PriorityFilter = Priority | 'all'

/**
 * 검색어(제목)와 우선순위 필터를 기준으로 태스크를 걸러낸다.
 */
export function filterTasks(
  tasks: Task[],
  query: string,
  priorityFilter: PriorityFilter,
): Task[] {
  const q = query.trim().toLowerCase()

  return tasks.filter((task) => {
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter
    if (!matchesPriority) return false

    if (!q) return true
    return task.title.toLowerCase().includes(q)
  })
}

/**
 * 태스크 배열을 status별로 그룹핑한다.
 */
export function groupByStatus(tasks: Task[]): Record<Status, Task[]> {
  const map: Record<Status, Task[]> = { todo: [], 'in-progress': [], done: [] }
  for (const t of tasks) map[t.status].push(t)
  return map
}

/**
 * race condition 방어를 위한 최신 요청 판별 로직.
 * 카드별 최신 mutationId와 이 요청의 mutationId가 같은지 확인한다.
 */
export function isLatestMutation(
  currentMutationId: number | undefined,
  myMutationId: number,
): boolean {
  return currentMutationId === myMutationId
}

/**
 * 배열의 특정 인덱스 자리에 항목을 다시 끼워 넣는다. (삭제 실패 시 롤백용)
 */
export function restoreAtIndex<T>(list: T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)]
}

/**
 * 생성 폼 입력값으로 낙관적으로 보여줄 임시 Task 객체를 만든다.
 */
export function buildOptimisticTask(
  tempId: string,
  now: string,
  form: {
    title: string
    priority: Priority
    description: string
    status: Status
  },
): Task {
  return {
    id: tempId,
    title: form.title,
    description: form.description,
    status: form.status,
    priority: form.priority,
    createdAt: now,
    updatedAt: now,
    version: 0,
  }
}
