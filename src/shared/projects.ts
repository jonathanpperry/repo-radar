export interface Repository {
  name: string
  path: string
}

export interface ProjectScan {
  folder: string
  repositories: Repository[]
  warnings: string[]
}
