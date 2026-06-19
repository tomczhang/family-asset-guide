// 受支持的语言与持久化。保持无外部依赖，避免与 dictionaries / types 形成循环引用。
export type Locale = "zh-CN" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["zh-CN", "en"];
export const DEFAULT_LOCALE: Locale = "zh-CN";

const STORAGE_KEY = "fag.locale";

export function isLocale(value: unknown): value is Locale {
  return value === "zh-CN" || value === "en";
}

// 读取持久化的语言偏好；非法或缺失时回退默认语言。SSR/隐私模式下 localStorage
// 可能抛错，做容错处理。
export function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

// 模块级「当前语言」。React 组件仍从 Context 读取以获得响应式刷新；少数非响应式
// 的数据构造（reducer 默认数据等）通过此入口读取当前语言，避免把 locale 透传到
// 每一个 action。setLocale 时由 Context 同步更新此值。
let activeLocale: Locale = getInitialLocale();

export function getActiveLocale(): Locale {
  return activeLocale;
}

export function setActiveLocale(locale: Locale): void {
  activeLocale = locale;
}
