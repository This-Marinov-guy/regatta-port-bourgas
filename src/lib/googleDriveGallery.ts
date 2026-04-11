const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
const DEFAULT_GALLERY_FOLDER_ID = '1L7iALLBsMHbBftZl41NAyr4wwujnxM87'
const DRIVE_REVALIDATE_SECONDS = 900

type DriveFile = {
  id: string
  name: string
  mimeType: string
  resourceKey?: string
}

type DriveListResponse = {
  files?: DriveFile[]
  nextPageToken?: string
}

export type GalleryPhoto = {
  src: string
  alt: string
}

export type GalleryYearGroup = {
  year: string
  photos: GalleryPhoto[]
}

function getDriveApiKey() {
  return process.env.GOOGLE_DRIVE_API_KEY
}

function getGalleryFolderId() {
  return process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_GALLERY_FOLDER_ID
}

function buildResourceKeysHeader(resourceKeys: Array<[string, string | undefined]>) {
  const pairs = resourceKeys
    .filter(([, resourceKey]) => Boolean(resourceKey))
    .map(([fileId, resourceKey]) => `${fileId}/${resourceKey}`)

  return pairs.length > 0 ? pairs.join(',') : undefined
}

async function listDriveFiles(params: {
  parentId: string
  query: string
  resourceKeys?: Array<[string, string | undefined]>
}) {
  const apiKey = getDriveApiKey()

  if (!apiKey) {
    return []
  }

  const files: DriveFile[] = []
  let pageToken: string | undefined

  do {
    const searchParams = new URLSearchParams({
      q: `'${params.parentId}' in parents and trashed = false and ${params.query}`,
      fields: 'nextPageToken, files(id, name, mimeType, resourceKey)',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      pageSize: '1000',
      key: apiKey
    })

    if (pageToken) {
      searchParams.set('pageToken', pageToken)
    }

    const resourceKeysHeader = buildResourceKeysHeader(params.resourceKeys ?? [])

    const response = await fetch(`${DRIVE_API_BASE_URL}?${searchParams.toString()}`, {
      headers: resourceKeysHeader
        ? {
            'X-Goog-Drive-Resource-Keys': resourceKeysHeader
          }
        : undefined,
      next: { revalidate: DRIVE_REVALIDATE_SECONDS }
    })

    if (!response.ok) {
      throw new Error(`Google Drive list failed with ${response.status}`)
    }

    const data = (await response.json()) as DriveListResponse
    files.push(...(data.files ?? []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return files
}

function sortYearFolders(folders: DriveFile[]) {
  return [...folders].sort((a, b) => {
    const aYear = Number.parseInt(a.name, 10)
    const bYear = Number.parseInt(b.name, 10)

    if (!Number.isNaN(aYear) && !Number.isNaN(bYear) && aYear !== bYear) {
      return bYear - aYear
    }

    return b.name.localeCompare(a.name, undefined, { numeric: true })
  })
}

function sortPhotos(files: DriveFile[]) {
  return [...files].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  )
}

export async function getGoogleDriveGallery(): Promise<GalleryYearGroup[]> {
  const apiKey = getDriveApiKey()

  if (!apiKey) {
    return []
  }

  try {
    const rootFolderId = getGalleryFolderId()
    const rootResourceKey = process.env.GOOGLE_DRIVE_GALLERY_RESOURCE_KEY

    const folders = await listDriveFiles({
      parentId: rootFolderId,
      query: `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
      resourceKeys: [[rootFolderId, rootResourceKey]]
    })

    const yearFolders = sortYearFolders(folders)

    const photoGroups = await Promise.all(
      yearFolders.map(async (folder) => {
        const photos = await listDriveFiles({
          parentId: folder.id,
          query: `mimeType contains 'image/'`,
          resourceKeys: [
            [rootFolderId, rootResourceKey],
            [folder.id, folder.resourceKey]
          ]
        })

        return {
          year: folder.name,
          photos: sortPhotos(photos).map((photo) => {
            const params = new URLSearchParams()

            if (photo.resourceKey) {
              params.set('rk', photo.resourceKey)
            }

            return {
              src: `/api/gallery/image/${photo.id}/${encodeURIComponent(photo.name)}${
                params.toString() ? `?${params.toString()}` : ''
              }`,
              alt: `${folder.name} - ${photo.name}`
            }
          })
        }
      })
    )

    return photoGroups
  } catch (error) {
    console.error('Failed to load Google Drive gallery:', error)
    return []
  }
}
