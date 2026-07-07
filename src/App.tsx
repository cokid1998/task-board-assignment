import { useState, useTransition } from 'react'
import Board from './Board'

export default function App() {
  const [inputValue, setInputValue] = useState('')
  const [query, setQuery] = useState('')
  const [_, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value) // UI에는 즉시 반영

    startTransition(() => {
      setQuery(e.target.value) // 진짜 필터링에 쓰이는 값은 후순위로
    })
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Board</h1>
        <p className="hint">
          스타터 baseline입니다. 요구사항은 <strong>과제 명세서</strong>를
          참고하세요.
        </p>
        <input value={inputValue} onChange={handleChange} />
      </header>
      <Board query={query} />
    </div>
  )
}

/**
 * P4
 * - 검색
 * input버벅임 해결
 * UI용 query와 실제 query에 사용하는 값을 분리해 useTransition으로 타이핑을 할 때 버벅임 해결
 * Card컴포넌트에 memo를 활용하여 query에 맞는 기존 Card를 리렌더링 하지않도록 방지하여 리렌더링 연산 최적화
 * ex) 5000개 중 검색어 매칭 1000개인 경우
 * memo 없음: 4000개 DOM 제거 + 남은 1000개도 매번 재계산(리렌더)
 * memo 적용: 4000개 DOM 제거만 발생, 남은 1000개는 재계산 자체를 생략
 */
