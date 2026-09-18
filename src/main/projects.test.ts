import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { getGitStatus } from './git'

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
  it('discovers repositories recursively and falls back to sorting by name', async () => {
    const root = await mkdtemp(join(tmpdir(), 'repo-radar-'))
    tempDirectories.push(root)

    const alpha = join(root, 'alpha')
    const beta = join(root, 'nested', 'beta')

    await mkdir(join(alpha, '.git'), { recursive: true })
    await mkdir(join(beta, '.git'), { recursive: true })

    const result = await scanProjects(root)

    expect(result.repositories.map((repository) => repository.name)).toEqual(['alpha', 'beta'])

    expect(result.warnings).toEqual([])
  })

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
  })

  it('sorts repositories by most recent commit date', async () => {
    const root = await mkdtemp(join(tmpdir(), 'repo-radar-'))
    tempDirectories.push(root)

    const olderRepo = join(root, 'older-repo')
    const newerRepo = join(root, 'newer-repo')

    await mkdir(join(olderRepo, '.git'), { recursive: true })
    await mkdir(join(newerRepo, '.git'), { recursive: true })

    vi.mocked(getGitStatus).mockImplementation(async (directory) => ({
      available: true,
      branch: 'main',
      isDirty: false,
      lastCommitDate: directory === newerRepo ? '2026-09-18T12:00:00Z' : '2026-09-17T12:00:00Z'
    }))

    const result = await scanProjects(root)

    expect(result.repositories.map((repository) => repository.name)).toEqual([
      'newer-repo',
      'older-repo'
    ])
  })
})
