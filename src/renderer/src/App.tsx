import { useState } from 'react'
import type { ProjectScan } from '../../shared/projects'

function App(): React.JSX.Element {
  const [scan, setScan] = useState<ProjectScan | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function chooseAndScan(): Promise<void> {
    setIsBusy(true)
    setError(null)

    try {
      const result = await window.api.chooseAndScanProjects()

      // Canceling preserves the previous results.
      if (result !== null) {
        setScan(result)
      }
    } catch (err) {
      console.error('Project scan failed:', err)
      setError('Could not scan that folder. Check that it exists and is readable.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="dashboard">
      <h1>Repo Radar</h1>
      <p>Your local projects, in one place.</p>

      <button type="button" onClick={() => void chooseAndScan()} disabled={isBusy}>
        {isBusy ? 'Choosing or scanning…' : 'Choose projects folder'}
      </button>

      {error && <p role="alert">{error}</p>}

      <section aria-live="polite" aria-busy={isBusy}>
        {scan ? (
          <>
            <h2>
              {scan.repositories.length}{' '}
              {scan.repositories.length === 1 ? 'repository' : 'repositories'} found
            </h2>
            <p className="project-path">{scan.folder}</p>

            {scan.repositories.length === 0 ? (
              <p>No repositories found in this folder or its immediate subfolders.</p>
            ) : (
              <ul className="repository-list">
                {scan.repositories.map((repository) => (
                  <li key={repository.path} className="repository-card">
                    <h3>{repository.name}</h3>
                    <p className="project-path">{repository.path}</p>
                  </li>
                ))}
              </ul>
            )}

            {scan.warnings.length > 0 && (
              <div>
                <h3>Some folders could not be inspected</h3>
                <ul>
                  {scan.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p>Select the folder where you keep your Git repositories.</p>
        )}
      </section>
    </main>
  )
}

export default App
