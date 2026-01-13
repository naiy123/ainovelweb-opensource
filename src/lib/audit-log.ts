import { prisma } from "./db"

/**
 * 安全审计事件类型
 */
export type AuditEventType =
  // 认证相关
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.login.locked"
  | "auth.logout"
  | "auth.register.success"
  | "auth.register.failed"
  | "auth.password.reset.request"
  | "auth.password.reset.success"
  | "auth.password.reset.failed"
  | "auth.wechat.login.success"
  | "auth.wechat.login.failed"
  // 安全相关
  | "security.csrf.blocked"
  | "security.rate_limit.exceeded"
  | "security.recaptcha.failed"
  | "security.suspicious_activity"
  // 账户相关
  | "account.locked"
  | "account.unlocked"
  | "account.profile.updated"
  | "account.email.changed"
  | "account.phone.changed"
  // 敏感操作
  | "payment.order.created"
  | "payment.success"
  | "payment.failed"

/**
 * 审计日志严重级别
 */
export type AuditSeverity = "info" | "warning" | "error" | "critical"

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  username?: string
  ip: string
  userAgent?: string
  details?: Record<string, unknown>
  success: boolean
}

/**
 * 获取事件的默认严重级别
 */
function getDefaultSeverity(eventType: AuditEventType, success: boolean): AuditSeverity {
  if (eventType.includes("failed") || !success) {
    if (eventType.includes("login") || eventType.includes("password")) {
      return "warning"
    }
    return "error"
  }

  if (
    eventType.includes("locked") ||
    eventType.includes("blocked") ||
    eventType.includes("suspicious")
  ) {
    return "critical"
  }

  if (eventType.includes("security")) {
    return "warning"
  }

  return "info"
}

/**
 * 记录安全审计日志
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  const severity = getDefaultSeverity(entry.eventType, entry.success)

  // 构建日志消息
  const logData = {
    timestamp: new Date().toISOString(),
    eventType: entry.eventType,
    severity,
    userId: entry.userId || "anonymous",
    username: entry.username || "unknown",
    ip: entry.ip,
    userAgent: entry.userAgent,
    success: entry.success,
    details: entry.details,
  }

  // 控制台日志（开发环境）
  if (process.env.NODE_ENV === "development") {
    const logMethod =
      severity === "critical" || severity === "error"
        ? console.error
        : severity === "warning"
          ? console.warn
          : console.info

    logMethod(`[AUDIT] ${entry.eventType}`, logData)
  }

  // 尝试写入数据库
  try {
    // 检查是否有 AuditLog 表（可能尚未迁移）
    await prisma.$queryRaw`
      INSERT INTO audit_logs (event_type, severity, user_id, username, ip, user_agent, success, details, created_at)
      VALUES (${entry.eventType}, ${severity}, ${entry.userId || null}, ${entry.username || null}, ${entry.ip}, ${entry.userAgent || null}, ${entry.success}, ${JSON.stringify(entry.details || {})}, NOW())
    `.catch(() => {
      // 表不存在时静默失败，只记录控制台
    })
  } catch {
    // 数据库写入失败时不影响主流程
    console.error("[AUDIT] Failed to write audit log to database:", logData)
  }
}

/**
 * 记录登录成功
 */
export async function logLoginSuccess(
  userId: string,
  username: string,
  ip: string,
  userAgent?: string,
  method: "password" | "phone" | "wechat" = "password"
): Promise<void> {
  await logAuditEvent({
    eventType: method === "wechat" ? "auth.wechat.login.success" : "auth.login.success",
    severity: "info",
    userId,
    username,
    ip,
    userAgent,
    success: true,
    details: { method },
  })
}

/**
 * 记录登录失败
 */
export async function logLoginFailed(
  username: string,
  ip: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "auth.login.failed",
    severity: "warning",
    username,
    ip,
    userAgent,
    success: false,
    details: { reason },
  })
}

/**
 * 记录账户锁定
 */
export async function logAccountLocked(
  userId: string,
  username: string,
  ip: string,
  failedAttempts: number
): Promise<void> {
  await logAuditEvent({
    eventType: "account.locked",
    severity: "critical",
    userId,
    username,
    ip,
    success: true,
    details: { failedAttempts },
  })
}

/**
 * 记录注册成功
 */
export async function logRegisterSuccess(
  userId: string,
  username: string,
  ip: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "auth.register.success",
    severity: "info",
    userId,
    username,
    ip,
    userAgent,
    success: true,
  })
}

/**
 * 记录注册失败
 */
export async function logRegisterFailed(
  username: string,
  ip: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "auth.register.failed",
    severity: "warning",
    username,
    ip,
    userAgent,
    success: false,
    details: { reason },
  })
}

/**
 * 记录密码重置请求
 */
export async function logPasswordResetRequest(
  username: string,
  ip: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "auth.password.reset.request",
    severity: "info",
    username,
    ip,
    userAgent,
    success: true,
  })
}

/**
 * 记录密码重置成功
 */
export async function logPasswordResetSuccess(
  userId: string,
  username: string,
  ip: string
): Promise<void> {
  await logAuditEvent({
    eventType: "auth.password.reset.success",
    severity: "info",
    userId,
    username,
    ip,
    success: true,
  })
}

/**
 * 记录 CSRF 攻击被阻止
 */
export async function logCsrfBlocked(
  ip: string,
  path: string,
  origin?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "security.csrf.blocked",
    severity: "warning",
    ip,
    success: false,
    details: { path, origin },
  })
}

/**
 * 记录速率限制超出
 */
export async function logRateLimitExceeded(
  ip: string,
  limitType: string,
  username?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "security.rate_limit.exceeded",
    severity: "warning",
    username,
    ip,
    success: false,
    details: { limitType },
  })
}

/**
 * 记录 reCAPTCHA 验证失败
 */
export async function logRecaptchaFailed(
  ip: string,
  score?: number,
  action?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "security.recaptcha.failed",
    severity: "warning",
    ip,
    success: false,
    details: { score, action },
  })
}

/**
 * 记录可疑活动
 */
export async function logSuspiciousActivity(
  ip: string,
  description: string,
  userId?: string,
  username?: string
): Promise<void> {
  await logAuditEvent({
    eventType: "security.suspicious_activity",
    severity: "critical",
    userId,
    username,
    ip,
    success: false,
    details: { description },
  })
}
