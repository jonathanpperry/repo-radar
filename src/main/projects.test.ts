import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

vi.mock('./git', () => ({
  getGitStatus: vi.fn(async () => ({
    available: true,
    branch: 'main',
    isDirty: false,
    lastCommitDate: null
  }))
}))

import { scanProjects } from './projects'

const tempDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    tempDirectories.map((directory) =>
      rm(directory, {
        recursive: true,
        force: true
      })
    )
  )

  tempDirectories.length = 0
})

describe('scanProjects', () => {
  ;(it('discovers repositories recursively and sorts them by name', async () => {
    const root = await mkdtemp(join(tmpdir(), 'repo-radar-'))
    tempDirectories.push(root)

    const alpha = join(root, 'alpha')
    const beta = join(root, 'nested', 'beta')

    await mkdir(join(alpha, '.git'), { recursive: true })
    await mkdir(join(beta, '.git'), { recursive: true })

    const result = await scanProjects(root)

    expect(result.repositories.map((repository) => repository.name)).toEqual(['alpha', 'beta'])

    expect(result.warnings).toEqual([])
  }),
    it('ignores common generated and dependency directories', async () => {
      const root = await mkdtemp(join(tmpdir(), 'repo-radar-'))
      tempDirectories.push(root)

      const visibleRepo = join(root, 'visible-repo')

      await mkdir(join(visibleRepo, '.git'), { recursive: true })

      for (const ignoredDirectory of ['node_modules', 'dist', 'build', 'out']) {
        await mkdir(join(root, ignoredDirectory, 'hidden-repo', '.git'), {
          recursive: true
        })
      }

      const result = await scanProjects(root)

      expect(result.repositories.map((repository) => repository.name)).toEqual(['visible-repo'])

      expect(result.warnings).toEqual([])
    }))
})
