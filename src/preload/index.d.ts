import { ElectronAPI } from '@electron-toolkit/preload'
import type { ProjectScan } from '../shared/projects'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      chooseAndScanProjects: () => Promise<ProjectScan | null>
    }
  }
}
