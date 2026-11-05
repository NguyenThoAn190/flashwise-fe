import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

/**
 * App thật bọc toàn bộ cây component trong `NextIntlClientProvider`
 * (xem `src/app/[locale]/layout.tsx`). Test render trực tiếp `<Header />` /
 * `<MobileDrawer />` nên cần provider tương đương, nếu không
 * `useTranslations()` / `useLocale()` sẽ throw "No intl context found".
 *
 * Vì các test import `render` trực tiếp từ `@testing-library/react`, ta wrap
 * hàm `render` ở tầng module để mọi test đều tự động có provider mà không
 * cần sửa từng file test.
 */
vi.mock("@testing-library/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@testing-library/react")>();
  const { NextIntlClientProvider } = await import("next-intl");
  const { default: enMessages } = await import("../messages/en.json");

  /**
   * App thật bọc cây component trong `NextIntlClientProvider`
   * (xem `src/app/[locale]/layout.tsx`). Test render trực tiếp `<Header />` /
   * `<MobileDrawer />` nên cần provider tương đương, nếu không
   * `useTranslations()` / `useLocale()` sẽ throw "No intl context found".
   *
   * Không bọc `AuthProvider` ở đây: nhiều test tự mock module
   * `@/lib/context/AuthContext` (chỉ export `useAuth`), nên provider thật sẽ
   * không tồn tại trong các test đó. Test cần auth tự bọc `AuthProvider`.
   */
  function IntlTestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return {
    ...actual,
    render: (
      ui: React.ReactElement,
      options?: Parameters<typeof actual.render>[1]
    ) => {
      const userWrapper = options?.wrapper;
      return actual.render(ui, {
        ...options,
        wrapper: userWrapper
          ? ({ children }: { children: React.ReactNode }) => (
              <IntlTestWrapper>
                {/* `wrapper` của Testing Library có kiểu
                    `JSXElementConstructor` nên phải render như element
                    thay vì gọi như function. */}
                {React.createElement(userWrapper, { children })}
              </IntlTestWrapper>
            )
          : IntlTestWrapper,
      });
    },
  };
});

// Automatically clean up DOM after every test
afterEach(() => {
  cleanup();
});

// Polyfill window.matchMedia for responsive components
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Polyfill ResizeObserver
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

  // Polyfill IntersectionObserver
  class IntersectionObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}
