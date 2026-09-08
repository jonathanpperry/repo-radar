import { useState } from 'react'

function App(): React.JSX.Element {
  const [folder, setFolder] = useState<string | null>(null)
  const [isChoosing, setIsChoosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function chooseFolder(): Promise<void> {
    setIsChoosing(true)
    setError(null)

    try {
      const selectedFolder = await window.api.chooseProjectsFolder()

      if (selectedFolder !== null) {
        setFolder(selectedFolder)
      }
    } catch (err) {
      console.error('Folder selection failed:', err)
      setError('Could not open the folder picker. Please try again.')
    } finally {
      setIsChoosing(false)
    }
  }

  return (
    <main style={{ maxWidth: 640, padding: 32 }}>
      <h1>Repo Radar</h1>
      <p>Your local projects, in one place.</p>

      <button
        type="button"
        onClick={() => void chooseFolder()}
        disabled={isChoosing}
        style={{ marginTop: 24, padding: '12px 20px', cursor: 'pointer' }}
      >
        {isChoosing ? 'Choosing folder…' : 'Choose projects folder'}
      </button>

      <div aria-live="polite" style={{ marginTop: 24 }}>
        {folder ? (
          <>
            <h2>Selected folder</h2>
            <p style={{ overflowWrap: 'anywhere', userSelect: 'text' }}>{folder}</p>
          </>
        ) : (
          <p>Select the folder where you keep your Git repositories.</p>
        )}
      </div>

      {error && <p role="alert">{error}</p>}
    </main>
  )
}

export default App
