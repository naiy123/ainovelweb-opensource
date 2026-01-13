// 每日灵感预设数据 - 50条
export interface Inspiration {
  type: "场景描写" | "人物塑造" | "写作技巧" | "情节构思" | "对话技巧" | "氛围营造";
  content: string;
}

export const dailyInspirations: Inspiration[] = [
  // 场景描写 (10条)
  { type: "场景描写", content: "在日落时分，城市的天际线染上金色，玻璃幕墙反射出耀眼的光芒" },
  { type: "场景描写", content: "雨后的街道泛着微光，空气中弥漫着泥土和青草的气息" },
  { type: "场景描写", content: "老旧的咖啡馆里，阳光透过百叶窗洒落在木质地板上，形成斑驳的光影" },
  { type: "场景描写", content: "深夜的图书馆，只有台灯发出柔和的光，翻书声显得格外清晰" },
  { type: "场景描写", content: "初雪覆盖了整个城市，世界仿佛被按下了静音键" },
  { type: "场景描写", content: "海边的灯塔在暮色中亮起，成为黑暗中唯一的指引" },
  { type: "场景描写", content: "破晓时分的山谷，雾气缭绕如同仙境，远处传来鸟儿的啼鸣" },
  { type: "场景描写", content: "古老的石板路上，青苔填满了缝隙，诉说着岁月的痕迹" },
  { type: "场景描写", content: "繁华商场的橱窗里，模特穿着最新的时装，霓虹灯闪烁不停" },
  { type: "场景描写", content: "废弃的游乐园里，生锈的摩天轮在风中吱呀作响" },

  // 人物塑造 (10条)
  { type: "人物塑造", content: "角色的内心矛盾是推动情节发展的关键，让读者看到他的挣扎" },
  { type: "人物塑造", content: "通过角色对小事物的态度，展现其性格深处的特质" },
  { type: "人物塑造", content: "每个反派都有自己的逻辑，试着从他的角度解释他的行为" },
  { type: "人物塑造", content: "角色的口头禅和习惯动作，能让读者更容易记住他" },
  { type: "人物塑造", content: "让角色犯错，完美的人物往往缺乏真实感" },
  { type: "人物塑造", content: "角色的成长弧线应该循序渐进，突如其来的改变会显得不自然" },
  { type: "人物塑造", content: "用角色的回忆和闪回，展现他成为现在这个人的原因" },
  { type: "人物塑造", content: "角色之间的关系网络要立体，不要让配角只为主角服务" },
  { type: "人物塑造", content: "通过他人的评价和反应，侧面展现角色的特点" },
  { type: "人物塑造", content: "给角色一个独特的专长或爱好，让他更加立体" },

  // 写作技巧 (10条)
  { type: "写作技巧", content: "尝试用对话展现角色性格，而非直接描述" },
  { type: "写作技巧", content: "善用「五感」描写，让场景更加身临其境" },
  { type: "写作技巧", content: "埋下伏笔时要自然，回收时要让读者有恍然大悟的感觉" },
  { type: "写作技巧", content: "删除那些不推进情节或不揭示角色的段落" },
  { type: "写作技巧", content: "第一稿尽管写，修改时再精雕细琢" },
  { type: "写作技巧", content: "用具体的细节代替抽象的形容词" },
  { type: "写作技巧", content: "每一章都应该有一个小高潮，保持读者的阅读兴趣" },
  { type: "写作技巧", content: "学会留白，有时候不说比说更有力量" },
  { type: "写作技巧", content: "注意叙事节奏，紧张和舒缓要有张有弛" },
  { type: "写作技巧", content: "大声朗读你写的句子，不通顺的地方会立刻显现" },

  // 情节构思 (8条)
  { type: "情节构思", content: "如果主角的计划进展顺利，不妨加入一个意外的转折" },
  { type: "情节构思", content: "尝试从结局倒推，看看哪些铺垫是必要的" },
  { type: "情节构思", content: "给主角设置一个不可调和的两难抉择" },
  { type: "情节构思", content: "让角色的最大优点在某个时刻成为他的致命弱点" },
  { type: "情节构思", content: "平行线索要在关键时刻交汇，产生化学反应" },
  { type: "情节构思", content: "误会可以制造戏剧冲突，但解决方式要合理" },
  { type: "情节构思", content: "高潮来临前，先让读者以为危机已经解除" },
  { type: "情节构思", content: "每个章节结束时，留下一个让读者想继续的钩子" },

  // 对话技巧 (6条)
  { type: "对话技巧", content: "每个角色说话的方式应该不同，用词习惯能体现身份背景" },
  { type: "对话技巧", content: "对话中可以有潜台词，角色不必总是直接表达想法" },
  { type: "对话技巧", content: "用动作和神态穿插在对话中，避免「他说」「她说」的单调" },
  { type: "对话技巧", content: "争吵的对话要让双方都有道理，读者会更投入" },
  { type: "对话技巧", content: "沉默有时比千言万语更有力量，学会在对话中使用停顿" },
  { type: "对话技巧", content: "角色说谎时，可以通过细微的矛盾让细心的读者察觉" },

  // 氛围营造 (6条)
  { type: "氛围营造", content: "用天气和环境的变化，烘托角色的心情转变" },
  { type: "氛围营造", content: "恐怖感来自于未知，让读者的想象比你描述的更可怕" },
  { type: "氛围营造", content: "用声音来营造氛围：滴答的钟声、远处的脚步声..." },
  { type: "氛围营造", content: "气味是最容易被忽视的感官，但它最能唤起回忆" },
  { type: "氛围营造", content: "色彩可以传达情绪：冷色调的忧郁，暖色调的温馨" },
  { type: "氛围营造", content: "在紧张的场景中，用短句加快节奏；舒缓时用长句慢下来" },
];

// 获取随机灵感（不重复）
export function getRandomInspirations(count: number = 3): Inspiration[] {
  const shuffled = [...dailyInspirations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// 按类型分组
export function getInspirationsByType(): Record<string, Inspiration[]> {
  return dailyInspirations.reduce((acc, inspiration) => {
    if (!acc[inspiration.type]) {
      acc[inspiration.type] = [];
    }
    acc[inspiration.type].push(inspiration);
    return acc;
  }, {} as Record<string, Inspiration[]>);
}
