export type GitStatus =
  | {
      available: true
      branch: string
      isDirty: boolean
      lastCommitDate: string | null
    }
  | {
      available: false
      message: string
    }

export interface Repository {
  name: string
  path: string
  git: GitStatus
}

export interface ProjectScan {
  folder: string
  repositories: Repository[]
  warnings: string[]
}
