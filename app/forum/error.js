'use client'

export default function Error({ error, reset }) {
  const msg = String(error?.message || error || '')

  // Это та самая ошибка, которую даёт Chrome Translate
  // "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node"
  if (msg.includes("Failed to execute 'removeChild' on 'Node'")) {
    // Мягкий вариант: просто ничего не показываем, даём пользователю остаться на странице.
    // Можно сюда же позже повесить тихий лог на сервер, если нужно.
    return null
  }

  return (
    <div style={{
      padding: '16px',
      margin: '16px',
      borderRadius: '16px',
      background: 'rgba(15,20,28,.75)',
      color: '#fff', border: '1px solid rgba(0,255,255,.25)'
    }}>
      <h3 style={{marginTop:0}}>⚠️ Forum runtime error</h3>
      <pre style={{whiteSpace:'pre-wrap', fontSize:12, opacity:.9}}>
        {msg}
      </pre>
      <button
        onClick={() => reset()}
        style={{
          marginTop:12, padding:'8px 12px', borderRadius:12,
          background:'rgba(0,255,255,.15)',
          border:'1px solid rgba(0,255,255,.3)',
          color:'#c8ffff'
        }}
      >
        Try again
      </button>
    </div>
  )
}
