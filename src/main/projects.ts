import { readdir, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { ProjectScan } from '../shared/projects'

export async function scanProjects(folder: string): Promise<ProjectScan> {
  const result: ProjectScan = {
    folder,
    repositories: [],
    warnings: []
  }

  async function inspect(directory: string): Promise<void> {
    try {
      const marker = await stat(join(directory, '.git'))

      if (marker.isDirectory() || marker.isFile()) {
        result.repositories.push({
          name: basename(directory) || directory,
          path: directory
        })
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code

      // No .git marker simply means this isn't a repository.
      if (code === 'ENOENT' || code === 'ENOTDIR') return

      console.error('Could not inspect project:', directory, error)
      result.warnings.push(`Could not inspect ${directory}`)
    }
  }

  // Let a failure to read the selected folder reach the UI.
  const entries = await readdir(folder, { withFileTypes: true })

  await inspect(folder)

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (entry.name === '.git' || entry.name === 'node_modules') continue

    await inspect(join(folder, entry.name))
  }

  result.repositories.sort((a, b) => a.name.localeCompare(b.name))

  return result
}
