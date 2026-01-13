'use client'

export default function Background() {
  return (
    <div className="fixed inset-0 z-0 w-full h-full overflow-hidden bg-ink-950">
      {/* Base Noise Texture for "Paper" feel */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

      {/* Deep Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-[#0f1c2e] to-[#05080f] opacity-100" />

      {/* 动态灵气 (Animated Auras) */}
      {/* 青色灵力 - 左上 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />

      {/* 紫气东来 - 右中 */}
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-900/20 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000" />

      {/* 墨韵 - 底部 */}
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-ink-800/40 rounded-full mix-blend-multiply filter blur-[60px] animate-blob animation-delay-4000" />

      {/* 装饰性元素：类似阵法或星轨的线条 */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="90%" cy="10%" r="300" stroke="white" strokeWidth="1" fill="none" strokeDasharray="10 20" className="animate-spin-slow" />
         <circle cx="90%" cy="10%" r="250" stroke="white" strokeWidth="0.5" fill="none" />
         <path d="M0,800 Q400,600 800,900 T1600,800" stroke="white" strokeWidth="1" fill="none" className="animate-pulse" />
      </svg>

      {/* 飘落的粒子 (CSS 实现简化版) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-cyan-glow rounded-full opacity-40 animate-float" style={{animationDuration: '8s'}}></div>
         <div className="absolute top-[30%] left-[60%] w-1.5 h-1.5 bg-white rounded-full opacity-20 animate-float" style={{animationDuration: '12s'}}></div>
         <div className="absolute top-[70%] left-[10%] w-1 h-1 bg-cyan-glow rounded-full opacity-30 animate-float" style={{animationDuration: '10s'}}></div>
      </div>
    </div>
  )
}
