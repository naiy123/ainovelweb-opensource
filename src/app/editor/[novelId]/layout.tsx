import type { Metadata } from "next"
import { prisma } from "@/lib/db"

type Props = {
  params: Promise<{ novelId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { novelId } = await params

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { title: true },
  })

  return {
    title: novel ? `${novel.title} - 编辑` : "编辑器",
  }
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
