/**
 * 封面生成 Prompt 构建
 */

// ============ 类型定义 ============

export interface CoverGenerateInput {
  title: string
  author?: string
  channel?: string  // 男频/女频
  genre?: string    // 小说类型
  description?: string
}

// ============ Gemini Designer Prompt ============

/**
 * 构建 Gemini 封面生成的 Prompt（设计家模式）
 */
export function buildGeminiCoverPrompt(params: CoverGenerateInput): string {
  // 作者名部分
  const authorText = params.author
    ? `- Display author credit: "${params.author} 著" in small text near the bottom or below the title
- Author text should be noticeably smaller than the title (about 1/4 size)`
    : ""

  // 书籍简介
  const descriptionText = params.description
    ? `\n## STORY CONTEXT (for background inspiration):\n${params.description}`
    : ""

  // 频道信息
  const channelText = params.channel
    ? `\n## TARGET AUDIENCE:\n- This is a "${params.channel}" (${params.channel === "男频" ? "Male-oriented" : "Female-oriented"}) novel
- ${params.channel === "男频"
    ? "Male-oriented covers typically feature: powerful imagery, darker/bolder color schemes, action-oriented scenes, majestic landscapes, imposing characters"
    : "Female-oriented covers typically feature: elegant aesthetics, softer/romantic color palettes, beautiful characters, graceful scenes, emotional atmosphere"}`
    : ""

  // 小说类型
  const genreText = params.genre
    ? `\n## NOVEL GENRE:\n- This is a "${params.genre}" (${params.genre}) novel
- If this genre does NOT inherently contain Western elements (like 西幻/Western Fantasy), you MUST use Eastern/Chinese visual elements
- Eastern elements include: Chinese traditional architecture, Chinese landscapes (mountains, rivers, clouds), Chinese clothing styles, ink painting aesthetics, traditional Chinese motifs
- DO NOT include obvious Western elements (castles, knights, elves, dragons in Western style) unless the genre explicitly requires it`
    : ""

  return `Create a professional Chinese web novel (网络小说) book cover.

## TEXT REQUIREMENTS (CRITICAL):
- Display the title: "${params.title}" as the main focal text
${authorText}
- All text MUST be rendered in **Simplified Chinese characters**
- Text must be **perfectly legible, crisp, and without any garbled characters**
- Choose font style and text effects that match the story's genre and mood
- For longer titles: break into semantic phrases, each phrase can have different font styles/sizes, but arrange them in a balanced and aesthetically pleasing layout
${channelText}
${genreText}
${descriptionText}

## VISUAL STYLE:
- Analyze the title "${params.title}" and genre "${params.genre || "通用"}" to determine the appropriate visual style
- Create a fitting atmospheric background that matches the story's theme and genre
- Professional publishing quality

## COMPOSITION:
- Vertical book cover, 3:4 aspect ratio
- Strong visual hierarchy with title as focal point

## IMPORTANT:
- NO publisher logo
- Chinese text only - no English text
- The Chinese characters must be accurate and readable`
}

// ============ Volcengine Stylist Prompt ============

/**
 * 构建火山引擎风格家的元提示词（让 Doubao 生成 Seedream 的画面描述）
 */
export function buildStylistMetaPrompt(params: CoverGenerateInput): string {
  const stylePreference = params.channel === "女频"
    ? "女频言情风格，唯美浪漫，颜值即正义"
    : "男频爽文风格，视觉冲击，霸气张扬"

  return `你是中国网文封面视觉设计师。根据小说的标题、作者、简介，为 Seedream 文生图模型输出一段画面描述。

【输入】
- 标题：${params.title}
- 作者：${params.author || "佚名"}
- 类型：${params.genre || "通用"}
- 简介：${params.description || "无"}

【分析阶段】（内部思考，不输出）
1. 判断题材类型和目标受众（男频爽文/女频言情/二次元轻小说）
2. 确定画风（写实CG/国风厚涂/唯美插画/日系动漫）
3. 确定色调氛围
4. 将人名转化为外貌描述

【输出格式】
一段连贯的自然语言，按以下顺序组织：

1. 文字部分
格式：文字："完整标题"，小字："作者名·著"，文字在画面下方三分之一的位置（固定位置），[字体风格]，[字体效果]，加粗，紧凑，居中，部分笔画带有光效，文字周围带有光晕。

字体风格根据题材选择，只是部分示例，你需要自己思考：
- 都市/言情：流畅曲线艺术字，暖艳颜色，金色渐变
- 玄幻/武侠：大号毛笔字，厚重有力，金色/青铜色
- 末世/战争：硬朗粗体字，斜切刀削笔锋，暗色描边
- 轻小说/二次元：创意硬朗粗体，彩色渐变，光效描边
- 古风/宫斗：书法变形字体，顿挫飞白，渐变大气

2. 人物部分
一句话概括人物关系和整体感觉，再用几个词描述关键特征。
例如：一对都市男女亲密互动，男性穿衬衫领带显精英范、眼神温柔专注，女性长发柔顺妆容精致、服饰优雅

3. 背景部分
简洁描述场景，强调烘托人物的功能。
例如：背景暗色建筑凸显二人，营造都市言情的浪漫暧昧氛围

4. 风格收尾
用户偏好：${stylePreference}
根据题材和用户偏好结合，以下只是部分示例，你需要自己创造：
- 写实向：超细节，强烈光影对比，电影级CG，高清，细节刻画
- 国风向：国风厚涂，浓郁色彩，高清，细节刻画
- 唯美向：二维插画，CG，高清，细节刻画
- 日系向：二维动漫风格，高清，细节刻画，画风统一简洁

【受众偏好提示】
目标是下沉市场大众读者：
- 男频：视觉冲击，霸气张扬，美人相伴，神兵在手
- 女频：颜值即正义，氛围感拉满，情感张力
- 二次元：萌或帅，色彩明快，符合番剧观感
- 通用：标题醒目，情绪直给，拒绝文艺留白

【禁止事项】
- 不出现人名，用外貌描述代替
- 人物身上不出现文字
- 不使用bullet points、编号、小标题
- 不解释象征意义，只描述可见画面
- 不要过度复杂的排版描述

【最终输出审核】
不要有偏向暴力色情等字眼出来，和比较政策敏感的元素，你需要设计画面，而不是给出主观感受词汇。

请直接输出一段连贯的画面描述，不要有任何前缀或解释。`
}
