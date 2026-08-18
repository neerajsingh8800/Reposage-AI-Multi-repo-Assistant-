import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1>RepoSage</h1>
      <p>AI repository Q&A and impact analysis dashboard.</p>
      <div style={{ background: '#f4f4f5', padding: '1rem', borderRadius: '10px' }}>
        <p><strong>Backend:</strong> FastAPI</p>
        <p><strong>Retrieval:</strong> BM25 + semantic + graph boosting</p>
        <p><strong>Demo repo:</strong> sample_repo</p>
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
