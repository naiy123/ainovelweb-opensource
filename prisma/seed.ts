import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { id: "test-user-001" },
    update: {},
    create: {
      id: "test-user-001",
      nickname: "测试用户",
    },
  })

  console.log("Created test user:", user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
