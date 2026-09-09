import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GitStatus } from '../shared/projects'

const execFileAsync = promisify(execFile)

async function runGit(directory: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', ['--no-optional-locks', '-C', directory, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 5000,
    maxBuffer: 4 * 1024 * 1024
  })

  return stdout.trim()
}

async function getLastCommitDate(directory: string): Promise<string | null> {
  try {
    const date = await runGit(directory, ['log', '-1', '--format=%cI'])
    return date || null
  } catch (error) {
    console.error('Could not read last commit:', directory, error)
    return null
  }
}

export async function getGitStatus(directory: string): Promise<GitStatus> {
  try {
    const [branch, changes, lastCommitDate] = await Promise.all([
      runGit(directory, ['branch', '--show-current']),
      runGit(directory, [
        'status',
        '--porcelain=v1',
        '--untracked-files=normal',
        '--ignore-submodules=none'
      ]),
      getLastCommitDate(directory)
    ])

    return {
      available: true,
      branch: branch || 'Detached HEAD',
      isDirty: changes.length > 0,
      lastCommitDate
    }
  } catch (error) {
    console.error('Could not read Git status:', directory, error)

    const code = (error as NodeJS.ErrnoException).code

    return {
      available: false,
      message:
        code === 'ENOENT'
          ? 'Git was not found. Install Git and restart Repo Radar.'
          : 'Could not read Git status. Check the terminal for details.'
    }
  }
}
