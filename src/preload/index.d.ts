import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fetchMovies: (params: {
        page: number
        limit: number
        search?: string
        genres?: string[]
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
      }) => Promise<unknown>
    }
  }
}
