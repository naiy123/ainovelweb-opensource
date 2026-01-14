import type { Metadata } from "next"
import Link from 'next/link'

export const metadata: Metadata = {
  title: "隐私政策",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/login"
          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回登录
        </Link>

        <h1 className="text-3xl font-bold text-white mb-2">隐私政策</h1>
        <p className="text-ink-400 mb-8">更新日期：2024年12月</p>

        <div className="prose prose-invert prose-cyan max-w-none space-y-8 text-ink-200">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">引言</h2>
            <p>
              灵机写作（以下简称"我们"）非常重视用户的隐私和个人信息保护。本隐私政策说明了我们如何收集、
              使用、存储和保护您的个人信息，以及您所享有的相关权利。
            </p>
            <p>
              请您在使用我们的服务前，仔细阅读并理解本隐私政策的全部内容。使用我们的服务即表示您同意
              本隐私政策的内容。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">一、我们收集的信息</h2>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">1.1 您主动提供的信息</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>账号信息：</strong>注册时提供的手机号码</li>
              <li><strong>个人资料：</strong>您设置的昵称、头像等个人信息</li>
              <li><strong>创作内容：</strong>您在平台上创作的小说、角色设定、世界观等内容</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-6 mb-3">1.2 自动收集的信息</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>设备信息：</strong>设备型号、操作系统版本、浏览器类型等</li>
              <li><strong>日志信息：</strong>访问时间、浏览页面、操作记录等</li>
              <li><strong>网络信息：</strong>IP地址、网络运营商信息等</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">二、信息的使用</h2>
            <p>我们收集的信息将用于以下目的：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>提供服务：</strong>为您提供账号注册、登录、内容存储等基础服务</li>
              <li><strong>功能优化：</strong>分析用户使用习惯，改进产品功能和用户体验</li>
              <li><strong>安全保障：</strong>识别异常行为，防止欺诈和滥用</li>
              <li><strong>客户服务：</strong>响应您的咨询和反馈</li>
              <li><strong>智能服务：</strong>处理您的创作内容以提供智能辅助写作功能</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">三、信息的存储</h2>
            <p>
              <strong>3.1 存储地点：</strong>我们在中华人民共和国境内收集和产生的个人信息，将存储在境内。
            </p>
            <p>
              <strong>3.2 存储期限：</strong>我们仅在实现本政策所述目的所必需的期限内保留您的个人信息，
              除非法律另有规定或您另行授权。
            </p>
            <p>
              <strong>3.3 数据安全：</strong>我们采用行业标准的安全技术和管理措施保护您的个人信息，
              防止未经授权的访问、使用或泄露。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">四、信息的共享</h2>
            <p>我们不会将您的个人信息出售给第三方。在以下情况下，我们可能会共享您的信息：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>获得您的同意：</strong>在获得您明确同意的情况下与第三方共享</li>
              <li><strong>法律要求：</strong>根据法律法规、法律程序或政府强制性要求</li>
              <li><strong>服务提供商：</strong>与帮助我们提供服务的合作伙伴共享（如云服务、智能服务提供商），
              这些合作伙伴受严格的保密协议约束</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">五、您的权利</h2>
            <p>根据相关法律法规，您享有以下权利：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>访问权：</strong>查看我们持有的关于您的个人信息</li>
              <li><strong>更正权：</strong>更正不准确或不完整的个人信息</li>
              <li><strong>删除权：</strong>在特定情况下请求删除您的个人信息</li>
              <li><strong>撤回同意：</strong>撤回您之前给予的同意</li>
              <li><strong>账号注销：</strong>申请注销您的账号</li>
            </ul>
            <p className="mt-4">
              如需行使上述权利，请通过本政策末尾的联系方式与我们联系。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">六、Cookie和类似技术</h2>
            <p>
              我们使用Cookie和类似技术来：
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>保持您的登录状态</li>
              <li>记住您的偏好设置</li>
              <li>分析服务使用情况</li>
            </ul>
            <p className="mt-4">
              您可以通过浏览器设置管理Cookie，但这可能影响某些功能的正常使用。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">七、未成年人保护</h2>
            <p>
              我们非常重视对未成年人个人信息的保护。如果您是未满18周岁的未成年人，请在监护人的陪同和
              指导下阅读本政策，并在取得监护人同意后使用我们的服务。
            </p>
            <p>
              如果我们发现在未事先获得可证实的监护人同意的情况下收集了未成年人的个人信息，我们将
              尽快删除相关信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">八、隐私政策的更新</h2>
            <p>
              我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并注明更新日期。
              对于重大变更，我们会通过站内通知或其他适当方式通知您。
            </p>
            <p>
              建议您定期查阅本政策，以了解我们如何保护您的信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">九、联系我们</h2>
            <p>
              如果您对本隐私政策有任何疑问、意见或建议，或需要行使您的个人信息权利，请通过以下方式联系我们：
            </p>
            {/* 本地版本：邮箱已隐藏 */}
            <p className="text-cyan-400">（本地版本）</p>
            <p className="mt-4">
              我们将在收到您的请求后15个工作日内予以回复。
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-ink-800 text-center text-ink-500 text-sm">
          © 2024 灵机写作 版权所有
        </div>
      </div>
    </div>
  )
}
