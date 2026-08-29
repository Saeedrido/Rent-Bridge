import { useState } from 'react'

export function MinimalTest() {
  const [items] = useState([1, 2, 3])
  return (
    <div>
      {items.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  )
}