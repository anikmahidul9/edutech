import { v2 as cloudinary } from "cloudinary"
import { NextResponse } from "next/server"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  const { file, resourceType } = await request.json()

  if (!file) {
    return NextResponse.json(
      { message: "File data is required" },
      { status: 400 }
    )
  }

  try {
    const options: { [key: string]: any } = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      resource_type: resourceType || "image", // 'image' or 'raw' for PDFs
    }

    if (resourceType === "image") {
      options.transformation = [{ width: 1024, height: 576, crop: "fill" }]
    }

    const result = await cloudinary.uploader.upload(file, options)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload file" },
      { status: 500 }
    )
  }
}
