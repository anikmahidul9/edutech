import { NextResponse } from "next/server"

interface YouTubeSnippet {
  title: string;
  resourceId: {
    videoId: string;
  };
  thumbnails: {
    default: {
      url: string;
    };
  };
}

interface YouTubePlaylistItem {
  snippet: YouTubeSnippet;
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  error?: {
    message: string;
  };
}

const API_KEY = process.env.YOUTUBE_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get("playlistId")

  if (!playlistId) {
    return NextResponse.json(
      { message: "Playlist ID is required" },
      { status: 400 }
    )
  }

  if (!API_KEY) {
    return NextResponse.json(
      { message: "YouTube API key is not configured" },
      { status: 500 }
    )
  }

  try {
    const maxResults = 50 // Default limit for fetching video titles
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${API_KEY}&maxResults=${maxResults}`
    )
    const data: YouTubePlaylistResponse = await response.json()

    if (data.error) {
      return NextResponse.json(
        { message: data.error.message },
        { status: 500 }
      )
    }

    const videoTitles = data.items.map((item: YouTubePlaylistItem) => item.snippet.title)

    return NextResponse.json({ videoTitles }, { status: 200 })
  } catch (error) {
    console.error("Failed to fetch playlist video titles:", error);
    return NextResponse.json(
      { message: "Failed to fetch playlist video titles" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { playlistId, limit } = await request.json()

  if (!playlistId) {
    return NextResponse.json(
      { message: "Playlist ID is required" },
      { status: 400 }
    )
  }

  if (!API_KEY) {
    return NextResponse.json(
      { message: "YouTube API key is not configured" },
      { status: 500 }
    )
  }

  try {
    const maxResults = limit ? limit : 50
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${API_KEY}&maxResults=${maxResults}`
    )
    const data: YouTubePlaylistResponse = await response.json()

    if (data.error) {
      return NextResponse.json(
        { message: data.error.message },
        { status: 500 }
      )
    }

    const videos = data.items.map((item: YouTubePlaylistItem) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.default.url,
    }))

    return NextResponse.json(videos, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch playlist videos" },
      { status: 500 }
    )
  }
}