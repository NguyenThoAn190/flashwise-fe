import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { cn } from "@/lib/utils/cn";
import {
  QUIZLET_PALETTE,
  TOKENS,
  CSS_VARIABLE_MAP,
  SHADOW_TOKENS,
  RADIUS_TOKENS,
} from "@/lib/constants/tokens";
import {
  DEFAULT_API_URL,
  getApiBaseUrl,
  API_ENDPOINTS,
  DEFAULT_HEADERS,
} from "@/lib/api/config";
import tailwindConfig from "../../tailwind.config";

describe("Flashwise Design Tokens & Environment", () => {
  /* ==========================================================================
     1. cn utility (Authentic DOM Class Composition)
     ========================================================================== */
  describe("cn utility", () => {
    it("merges single and multiple string classes correctly", () => {
      expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("resolves boolean conditions and falsy values", () => {
      const isHidden = false;
      const isVisible = true;
      expect(cn("base", isHidden && "hidden", isVisible && "block", null, undefined)).toBe("base block");
    });

    it("resolves Tailwind conflicts using tailwind-merge precedence", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
      expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
      expect(cn("text-sm", "text-lg")).toBe("text-lg");
    });

    it("handles nested arrays and class objects", () => {
      expect(cn(["flex", ["items-center"]], { "justify-center": true, "opacity-0": false })).toBe(
        "flex items-center justify-center"
      );
    });
  });

  /* ==========================================================================
     2. Flashwise Brand Palette & Token Validation (Non-Tautological)
     ========================================================================== */
  describe("Flashwise Brand Palette Validation", () => {
    it("validates exported Flashwise hex constants match brand specifications", () => {
      // Validates genuine exported tokens from @/lib/constants/tokens
      expect(TOKENS.INDIGO).toBe("#4255ff");
      expect(TOKENS.INDIGO_HOVER).toBe("#3646db");
      expect(TOKENS.SLATE).toBe("#2e3856");
      expect(TOKENS.CANVAS).toBe("#f6f7fb");
      expect(TOKENS.SURFACE).toBe("#ffffff");
      expect(TOKENS.BORDER).toBe("#d9dde8");
      expect(TOKENS.GREEN).toBe("#23b26d");
      expect(TOKENS.CORAL).toBe("#ff725b");
      expect(TOKENS.GOLD).toBe("#ffcd1f");

      // Validates extended palette properties
      expect(QUIZLET_PALETTE.INDIGO_LIGHT).toBe("#eceeff");
      expect(QUIZLET_PALETTE.INDIGO_BORDER).toBe("#d3ddff");
      expect(QUIZLET_PALETTE.NAVY).toBe("#0a092d");
      expect(QUIZLET_PALETTE.WARNING).toBe("#ff983d");
      expect(QUIZLET_PALETTE.WARNING_BORDER).toBe("#fed7aa");
    });

    it("cross-verifies exported tokens against src/app/[locale]/globals.css custom properties", () => {
      const globalsCssPath = path.resolve(
        __dirname,
        "../../src/app/[locale]/globals.css"
      );
      expect(fs.existsSync(globalsCssPath)).toBe(true);

      const globalsCss = fs.readFileSync(globalsCssPath, "utf-8");

      // Verify that every defined CSS custom property in CSS_VARIABLE_MAP
      // is genuinely declared in globals.css with the exact matching hex value
      for (const [varName, expectedHex] of Object.entries(CSS_VARIABLE_MAP)) {
        const regex = new RegExp(`${varName}:\\s*(${expectedHex})\\b`, "i");
        expect(
          globalsCss,
          `Expected globals.css to declare "${varName}: ${expectedHex}"`
        ).toMatch(regex);
      }
    });

    it("validates tailwind.config.ts color tokens map to CSS variables or fallbacks", () => {
      const colors = (tailwindConfig.theme?.extend?.colors as any)?.quizlet;
      expect(colors).toBeDefined();
      expect(colors.indigo.DEFAULT).toContain("#4255ff");
      expect(colors.indigo.hover).toContain("#3646db");
      expect(colors.slate.DEFAULT).toContain("#2e3856");
      expect(colors.canvas).toContain("#f6f7fb");
      expect(colors.surface.DEFAULT).toContain("#ffffff");
      expect(colors.border.DEFAULT).toContain("#d9dde8");
      expect(colors.green.DEFAULT).toContain("#23b26d");
      expect(colors.coral.DEFAULT).toContain("#ff725b");
      expect(colors.gold.DEFAULT).toContain("#ffcd1f");
      expect(colors.warning.DEFAULT).toContain("#ff983d");
    });

    it("verifies shadow and border radius token definitions", () => {
      expect(SHADOW_TOKENS.card).toContain("0 4px 16px rgba(0, 0, 0, 0.04)");
      expect(SHADOW_TOKENS.flashcard3d).toContain("0 8px 30px rgba(0, 0, 0, 0.08)");
      expect(SHADOW_TOKENS.dropdown).toContain("0 12px 32px rgba(0, 0, 0, 0.12)");
      expect(RADIUS_TOKENS.sm).toBe("8px");
      expect(RADIUS_TOKENS.md).toBe("12px");
      expect(RADIUS_TOKENS.lg).toBe("16px");
      expect(RADIUS_TOKENS.xl).toBe("20px");
      expect(RADIUS_TOKENS.full).toBe("9999px");
    });
  });

  /* ==========================================================================
     3. API Gateway Environment Configuration (Authentic Module Verification)
     ========================================================================== */
  describe("API Gateway Environment Configuration", () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_API_URL = originalEnv;
      } else {
        delete process.env.NEXT_PUBLIC_API_URL;
      }
    });

    it("exports DEFAULT_API_URL matching standard gateway specification", () => {
      expect(DEFAULT_API_URL).toBe("http://localhost:8080/api/v1");
    });

    it("defaults to standard API Gateway URL when environment variable is unset", () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      const apiUrl = getApiBaseUrl();
      expect(apiUrl).toBe("http://localhost:8080/api/v1");
    });

    it("dynamically resolves custom environment variable when set", () => {
      process.env.NEXT_PUBLIC_API_URL = "https://gateway.playgrid.test/api/v1";
      const customUrl = getApiBaseUrl();
      expect(customUrl).toBe("https://gateway.playgrid.test/api/v1");
    });

    it("accepts an explicit customUrl argument override", () => {
      const explicitUrl = getApiBaseUrl("http://custom-host:9000/api/v1");
      expect(explicitUrl).toBe("http://custom-host:9000/api/v1");
    });

    it("exports standard API request headers including X-PlayGrid-Client", () => {
      expect(DEFAULT_HEADERS["Content-Type"]).toBe("application/json");
      expect(DEFAULT_HEADERS["X-PlayGrid-Client"]).toBe("web-app");
    });

    it("exports API route endpoints conforming to PROJECT.md specifications", () => {
      expect(API_ENDPOINTS.auth.signup).toBe("/auth/signup");
      expect(API_ENDPOINTS.auth.token).toBe("/auth/token");
      expect(API_ENDPOINTS.auth.signout).toBe("/auth/signout");
      expect(API_ENDPOINTS.auth.profile).toBe("/user/profile");

      expect(API_ENDPOINTS.studySets.list).toBe("/quizlet/study-sets");
      expect(API_ENDPOINTS.studySets.detail("123")).toBe("/quizlet/study-sets/123");
      expect(API_ENDPOINTS.studySets.duplicate("123")).toBe("/quizlet/study-sets/123/duplicate");
      expect(API_ENDPOINTS.studySets.cards("123")).toBe("/quizlet/study-sets/123/cards");

      expect(API_ENDPOINTS.sessions.start("456")).toBe("/quizlet/study-sets/456/sessions");
      expect(API_ENDPOINTS.sessions.next("sess-1")).toBe("/quizlet/sessions/sess-1/next");
      expect(API_ENDPOINTS.sessions.ratings("sess-1")).toBe("/quizlet/sessions/sess-1/ratings");
      expect(API_ENDPOINTS.progress.overview).toBe("/quizlet/users/me/progress");
      expect(API_ENDPOINTS.progress.reset).toBe("/quizlet/users/me/progress/reset");
    });
  });
});
