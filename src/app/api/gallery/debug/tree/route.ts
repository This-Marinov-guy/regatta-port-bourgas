import { NextResponse } from 'next/server'

const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
const DEFAULT_GALLERY_FOLDER_ID = '1L7iALLBsMHbBftZl41NAyr4wwujnxM87'

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

function buildResourceKeysHeader(resourceKeys: Array<[string, string | undefined]>) {
  const pairs = resourceKeys
    .filter(([, resourceKey]) => Boolean(resourceKey))
    .map(([fileId, resourceKey]) => `${fileId}/${resourceKey}`)

  return pairs.length > 0 ? pairs.join(',') : undefined
}

async function listDriveFiles(params: {
  apiKey: string
  parentId: string
  query: string
  resourceKeys?: Array<[string, string | undefined]>
}) {
  const files: DriveFile[] = []
  let pageToken: string | undefined

  do {
    const searchParams = new URLSearchParams({
      q: `'${params.parentId}' in parents and trashed = false and ${params.query}`,
      fields: 'nextPageToken, files(id, name, mimeType, resourceKey)',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      pageSize: '1000',
      key: params.apiKey
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
      cache: 'no-store'
    })

    const data = (await response.json().catch(() => null)) as DriveListResponse | null

    if (!response.ok) {
      throw new Error(
        `Google Drive list failed with ${response.status}: ${JSON.stringify(data)}`
      )
    }

    files.push(...(data?.files ?? []))
    pageToken = data?.nextPageToken
  } while (pageToken)

  return files
}

export async function GET() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const rootFolderId =
    process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_GALLERY_FOLDER_ID
  const rootResourceKey = process.env.GOOGLE_DRIVE_GALLERY_RESOURCE_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_DRIVE_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  try {
    const yearFolders = await listDriveFiles({
      apiKey,
      parentId: rootFolderId,
      query: `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
      resourceKeys: [[rootFolderId, rootResourceKey]]
    })

    const years = await Promise.all(
      yearFolders.map(async (folder) => {
        const images = await listDriveFiles({
          apiKey,
          parentId: folder.id,
          query: `mimeType contains 'image/'`,
          resourceKeys: [
            [rootFolderId, rootResourceKey],
            [folder.id, folder.resourceKey]
          ]
        })

        return {
          folder,
          imageCount: images.length,
          sampleImages: images.slice(0, 5)
        }
      })
    )

    return NextResponse.json({
      rootFolderId,
      rootResourceKey: rootResourceKey || null,
      yearFolderCount: yearFolders.length,
      years
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
