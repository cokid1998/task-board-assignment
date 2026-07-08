import { describe, it, expect } from 'vitest'
import {
  isLatestMutation,
  filterTasks,
  groupByStatus,
  restoreAtIndex,
  buildOptimisticTask,
} from './tasks'
import type { Task } from '../types'

const make = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  status: 'todo',
  priority: 'medium',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  ...over,
})

describe('filterTasks', () => {
  it('검색어와 우선순위가 둘 다 맞는 태스크만 반환한다', () => {
    const tasks = [
      make('a', { title: 'Fix login bug', priority: 'high' }),
      make('b', { title: 'Fix logout bug', priority: 'low' }),
      make('c', { title: 'Write docs', priority: 'high' }),
    ]
    expect(filterTasks(tasks, 'fix', 'high')).toEqual([tasks[0]])
  })

  it('priorityFilter가 all이면 검색어만 적용한다', () => {
    const tasks = [
      make('a', { title: 'Fix login bug', priority: 'high' }),
      make('b', { title: 'Fix logout bug', priority: 'low' }),
    ]
    expect(filterTasks(tasks, 'fix', 'all')).toHaveLength(2)
  })

  it('검색어가 비어있으면 우선순위만 적용한다', () => {
    const tasks = [
      make('a', { priority: 'high' }),
      make('b', { priority: 'low' }),
    ]
    expect(filterTasks(tasks, '   ', 'high')).toHaveLength(1)
  })

  it('둘 다 조건이 없으면(all + 빈 검색어) 전체를 반환한다', () => {
    const tasks = [make('a'), make('b')]
    expect(filterTasks(tasks, '', 'all')).toHaveLength(2)
  })

  it('아무것도 매칭 안 되면 빈 배열을 반환한다', () => {
    const tasks = [make('a', { title: 'Fix bug', priority: 'high' })]
    expect(filterTasks(tasks, 'docs', 'all')).toEqual([])
  })
})

describe('groupByStatus', () => {
  it('status별로 정확히 분류한다', () => {
    const tasks = [
      make('a', { status: 'todo' }),
      make('b', { status: 'in-progress' }),
      make('c', { status: 'done' }),
      make('d', { status: 'todo' }),
    ]
    const grouped = groupByStatus(tasks)
    expect(grouped.todo).toHaveLength(2)
    expect(grouped['in-progress']).toHaveLength(1)
    expect(grouped.done).toHaveLength(1)
  })

  it('빈 배열이 들어오면 모든 그룹이 빈 배열이다', () => {
    const grouped = groupByStatus([])
    expect(grouped).toEqual({ todo: [], 'in-progress': [], done: [] })
  })
})

describe('isLatestMutation', () => {
  it('현재 mutationId와 내 mutationId가 같으면 최신 요청이다', () => {
    expect(isLatestMutation(3, 3)).toBe(true)
  })

  it('다르면 낡은 요청이다', () => {
    expect(isLatestMutation(3, 1)).toBe(false)
  })

  it('currentMutationId가 undefined면(기록 자체가 없으면) 낡은 요청으로 처리한다', () => {
    expect(isLatestMutation(undefined, 1)).toBe(false)
  })
})

describe('restoreAtIndex', () => {
  it('지정한 인덱스 자리에 항목을 다시 끼워 넣는다', () => {
    const list = [make('a'), make('b'), make('d')]
    const target = make('c')
    const restored = restoreAtIndex(list, 2, target)
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('맨 앞(인덱스 0)에도 복원할 수 있다', () => {
    const list = [make('b'), make('c')]
    const target = make('a')
    const restored = restoreAtIndex(list, 0, target)
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('맨 뒤(배열 길이와 같은 인덱스)에도 복원할 수 있다', () => {
    const list = [make('a'), make('b')]
    const target = make('c')
    const restored = restoreAtIndex(list, 2, target)
    expect(restored.map((t) => t.id)).toEqual(['a', 'b', 'c'])
  })

  it('원본 배열은 변경하지 않는다 (불변성)', () => {
    const list = [make('a'), make('b')]
    restoreAtIndex(list, 1, make('x'))
    expect(list.map((t) => t.id)).toEqual(['a', 'b'])
  })
})

describe('buildOptimisticTask', () => {
  it('입력값으로 올바른 형태의 Task 객체를 만든다', () => {
    const form = {
      title: '새 작업',
      priority: 'high' as const,
      description: '설명',
      status: 'todo' as const,
    }
    const task = buildOptimisticTask('temp-1', '2026-01-01T00:00:00.000Z', form)

    expect(task).toEqual({
      id: 'temp-1',
      title: '새 작업',
      description: '설명',
      status: 'todo',
      priority: 'high',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      version: 0,
    })
  })
})
