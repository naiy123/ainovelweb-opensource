import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

// 动态类型定义
export type ActivityType =
  | "welcome"           // 注册欢迎
  | "novel_created"     // 创建小说
  | "chapter_completed" // 完成章节
  | "word_milestone"    // 字数里程碑
  | "streak_achievement"// 连续创作成就
  | "ai_used"          // 使用AI功能
  | "cover_generated"   // 生成封面
  | "system_update"     // 系统更新

// 动态配置
const activityConfig: Record<ActivityType, { title: string }> = {
  welcome: { title: "欢迎加入" },
  novel_created: { title: "新作诞生" },
  chapter_completed: { title: "章节完成" },
  word_milestone: { title: "里程碑达成" },
  streak_achievement: { title: "创作成就" },
  ai_used: { title: "AI助力" },
  cover_generated: { title: "封面生成" },
  system_update: { title: "系统消息" },
}

// 创建用户动态
export async function createActivity(
  userId: string,
  type: ActivityType,
  description: string,
  metadata?: Record<string, unknown>
) {
  const config = activityConfig[type]

  return prisma.userActivity.create({
    data: {
      userId,
      type,
      title: config.title,
      description,
      metadata: metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
    },
  })
}

// 创建欢迎动态
export async function createWelcomeActivity(userId: string) {
  return createActivity(
    userId,
    "welcome",
    "欢迎来到创作空间，开启你的写作之旅！"
  )
}

// 创建新建小说动态
export async function createNovelCreatedActivity(
  userId: string,
  novelId: string,
  novelTitle: string
) {
  return createActivity(
    userId,
    "novel_created",
    `《${novelTitle}》已创建，开始你的创作吧！`,
    { novelId }
  )
}

// 创建章节完成动态
export async function createChapterCompletedActivity(
  userId: string,
  novelId: string,
  novelTitle: string,
  chapterTitle: string,
  wordCount: number
) {
  return createActivity(
    userId,
    "chapter_completed",
    `《${novelTitle}》${chapterTitle}完成，共${wordCount}字`,
    { novelId, chapterTitle, wordCount }
  )
}

// 创建字数里程碑动态
export async function createWordMilestoneActivity(
  userId: string,
  novelId: string,
  novelTitle: string,
  milestone: number
) {
  const milestoneText = milestone >= 10000
    ? `${milestone / 10000}万字`
    : `${milestone / 1000}千字`

  return createActivity(
    userId,
    "word_milestone",
    `恭喜！《${novelTitle}》突破${milestoneText}了`,
    { novelId, milestone }
  )
}

// 创建连续创作成就动态
export async function createStreakAchievementActivity(
  userId: string,
  days: number
) {
  return createActivity(
    userId,
    "streak_achievement",
    `连续创作${days}天！继续保持`,
    { days }
  )
}

// 创建AI使用动态
export async function createAIUsedActivity(
  userId: string,
  feature: string // "续写" | "润色" | "扩写" 等
) {
  return createActivity(
    userId,
    "ai_used",
    `使用AI${feature}功能创作`,
    { feature }
  )
}

// 创建封面生成动态
export async function createCoverGeneratedActivity(
  userId: string,
  novelId: string,
  novelTitle: string
) {
  return createActivity(
    userId,
    "cover_generated",
    `《${novelTitle}》的封面已生成`,
    { novelId }
  )
}

// 创建系统更新动态
export async function createSystemUpdateActivity(
  userId: string,
  message: string
) {
  return createActivity(
    userId,
    "system_update",
    message
  )
}

// 检查是否需要创建字数里程碑
export async function checkAndCreateMilestone(
  userId: string,
  novelId: string,
  novelTitle: string,
  totalWords: number
) {
  const milestones = [1000, 5000, 10000, 30000, 50000, 100000, 200000, 500000, 1000000]

  // 找到最近达成的里程碑
  const achievedMilestone = milestones
    .filter(m => totalWords >= m)
    .pop()

  if (!achievedMilestone) return null

  // 检查是否已经记录过这个里程碑
  const existingActivities = await prisma.userActivity.findMany({
    where: {
      userId,
      type: "word_milestone",
    },
    orderBy: { createdAt: "desc" },
  })

  // 找到该小说的最近里程碑记录
  const existingActivity = existingActivities.find(a => {
    const meta = a.metadata as { novelId?: string } | null
    return meta?.novelId === novelId
  })

  if (existingActivity) {
    const lastMilestone = (existingActivity.metadata as { milestone?: number })?.milestone
    if (lastMilestone && lastMilestone >= achievedMilestone) {
      return null
    }
  }

  return createWordMilestoneActivity(userId, novelId, novelTitle, achievedMilestone)
}
