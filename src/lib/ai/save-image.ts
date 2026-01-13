import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { prisma } from "@/lib/db"
import { isOSSConfigured, uploadImageToOSS } from "@/lib/aliyun-oss"

interface SaveImageOptions {
  userId: string
  type: "background" | "cover"
  imageBase64: string
  title?: string
  author?: string
  prompt?: string
}

/**
 * 保存生成的图片到OSS或本地文件系统，并记录到数据库
 * 优先使用OSS存储，如果OSS未配置则降级到本地存储
 */
export async function saveGeneratedImage(options: SaveImageOptions) {
  const { userId, type, imageBase64, title, author, prompt } = options

  // 生成唯一文件名
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const filename = `${type}_${timestamp}_${randomStr}.png`
  const imageBuffer = Buffer.from(imageBase64, "base64")

  let imageUrl: string

  // 优先使用OSS存储
  if (isOSSConfigured()) {
    try {
      // 上传到OSS，按类型分文件夹
      const folder = type === "cover" ? "covers" : "backgrounds"
      imageUrl = await uploadImageToOSS(imageBuffer, filename, folder)
      console.log(`✅ 图片已上传到OSS: ${imageUrl}`)
    } catch (error) {
      console.error("OSS上传失败，降级到本地存储:", error)
      // OSS失败时降级到本地存储
      imageUrl = await saveToLocalFile(imageBuffer, filename)
    }
  } else {
    // OSS未配置，使用本地存储
    imageUrl = await saveToLocalFile(imageBuffer, filename)
  }

  // 保存到数据库
  const record = await prisma.generatedImage.create({
    data: {
      userId,
      type,
      imageUrl,
      title,
      author,
      prompt,
    },
  })

  console.log(`✅ 图片记录已保存: ${imageUrl} (ID: ${record.id})`)

  return {
    id: record.id,
    imageUrl,
  }
}

/**
 * 保存图片到本地文件系统（降级方案）
 */
async function saveToLocalFile(imageBuffer: Buffer, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "generated")
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, filename)
  await writeFile(filePath, imageBuffer)

  console.log(`✅ 图片已保存到本地: /generated/${filename}`)
  return `/generated/${filename}`
}
