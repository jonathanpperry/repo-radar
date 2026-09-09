import { readdir, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { ProjectScan } from '../shared/projects'
import { getGitStatus } from './git'

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
          path: directory,
          git: await getGitStatus(directory)
        })

        // Don't recurse inside an already-discovered repo.
        return
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code

      if (code !== 'ENOENT' && code !== 'ENOTDIR') {
        console.error('Could not inspect project:', directory, error)
        result.warnings.push(`Could not inspect ${directory}`)
        return
      }
    }

    // No .git marker here, so search subdirectories.
    let entries

    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error) {
      console.error('Could not read directory:', directory, error)
      result.warnings.push(`Could not read ${directory}`)
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      if (
        entry.name === '.git' ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === 'out'
      ) {
        continue
      }

      await inspect(join(directory, entry.name))
    }
  }

  // Let a failure to read the selected root reach the UI.
  await readdir(folder)

  await inspect(folder)

  result.repositories.sort((a, b) => a.name.localeCompare(b.name))

  return result
}
