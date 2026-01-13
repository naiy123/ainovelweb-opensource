import type { Metadata } from "next"
import Link from 'next/link'

export const metadata: Metadata = {
  title: "用户协议",
}

export default function TermsPage() {
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

        <h1 className="text-3xl font-bold text-white mb-2">用户服务协议</h1>
        <p className="text-ink-400 mb-8">更新日期：2024年12月</p>

        <div className="prose prose-invert prose-cyan max-w-none space-y-8 text-ink-200">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">一、服务条款的接受</h2>
            <p>
              欢迎使用灵机写作（以下简称"本平台"或"我们"）。在使用本平台提供的服务之前，请您仔细阅读本协议的全部内容。
              一旦您注册、登录、使用本平台服务，即表示您已充分阅读、理解并同意接受本协议的全部条款。
            </p>
            <p>
              如果您不同意本协议的任何条款，请不要注册或使用本平台的服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">二、服务内容</h2>
            <p>本平台为用户提供以下服务：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>智能辅助小说创作工具</li>
              <li>角色设定管理功能</li>
              <li>世界观与设定词条管理</li>
              <li>智能续写、改写、润色等文本处理功能</li>
              <li>作品存储与管理服务</li>
            </ul>
            <p className="mt-4">
              本平台有权根据业务发展需要，随时调整、增加或减少服务内容，并将通过适当方式通知用户。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">三、用户账号</h2>
            <p>
              <strong>3.1 账号注册：</strong>您需要使用有效的手机号码注册账号。您应保证所提供的信息真实、准确、完整，
              并在信息变更时及时更新。
            </p>
            <p>
              <strong>3.2 账号安全：</strong>您应妥善保管账号及密码信息，因您个人原因导致的账号泄露、被盗等情况，
              由您自行承担相应责任。
            </p>
            <p>
              <strong>3.3 账号使用：</strong>您的账号仅限本人使用，不得转让、出借或与他人共享。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">四、用户行为规范</h2>
            <p>您在使用本平台服务时，应遵守以下规定：</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>遵守中华人民共和国相关法律法规</li>
              <li>不得利用本平台制作、复制、发布、传播违法违规内容</li>
              <li>不得侵犯他人知识产权、隐私权等合法权益</li>
              <li>不得利用本平台从事任何危害国家安全、扰乱社会秩序的行为</li>
              <li>不得干扰本平台的正常运营</li>
              <li>不得利用技术手段攻击、入侵本平台系统</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">五、知识产权</h2>
            <p>
              <strong>5.1 平台权利：</strong>本平台的商标、标识、界面设计、软件程序等知识产权归本平台所有，
              未经授权不得使用。
            </p>
            <p>
              <strong>5.2 用户内容：</strong>您通过本平台创作的原创内容，其知识产权归您所有。但您授权本平台
              在提供服务过程中合理使用这些内容。
            </p>
            <p>
              <strong>5.3 智能生成内容：</strong>智能辅助生成的内容仅供参考和创作灵感，您应对最终作品内容
              负责，确保不侵犯他人权益。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">六、服务费用</h2>
            <p>
              本平台部分功能可能需要付费使用。具体收费标准将在相关页面明确展示，您在购买前应仔细了解。
              已支付的费用，除法律规定或本协议另有约定外，一般不予退还。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">七、免责声明</h2>
            <p>
              <strong>7.1</strong> 本平台提供的智能功能基于机器学习技术，生成内容可能存在不准确、不完整的情况，
              仅供参考，不构成任何专业建议。
            </p>
            <p>
              <strong>7.2</strong> 因不可抗力、系统维护、网络故障等原因导致的服务中断，本平台不承担责任，
              但会尽快恢复服务。
            </p>
            <p>
              <strong>7.3</strong> 您使用本平台创作的内容，应自行确保合法合规，因内容违规导致的法律责任
              由您自行承担。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">八、协议修改</h2>
            <p>
              本平台有权根据需要修改本协议内容，修改后的协议将在平台公布。如您继续使用本平台服务，
              即视为您接受修改后的协议。如您不同意修改内容，应停止使用本平台服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">九、联系方式</h2>
            <p>
              如您对本协议有任何疑问，或在使用过程中遇到问题，请通过以下方式联系我们：
            </p>
            <p className="text-cyan-400">邮箱：support@lingji.ai</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">十、其他</h2>
            <p>
              本协议的解释、效力及争议解决均适用中华人民共和国法律。因本协议引起的争议，
              双方应友好协商解决；协商不成的，任何一方均可向本平台所在地有管辖权的人民法院提起诉讼。
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
