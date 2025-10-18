'use client'

export default function Error({ error, reset }) {
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
        {String(error?.message || error)}
      </pre>
      <button onClick={() => reset()} style={{
        marginTop:12, padding:'8px 12px', borderRadius:12,
        background:'rgba(0,255,255,.15)', border:'1px solid rgba(0,255,255,.3)',
        color:'#c8ffff'
      }}>
        Try again
      </button>
    </div>
  )
}
