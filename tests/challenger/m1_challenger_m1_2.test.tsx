import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/Dialog";
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownDivider,
} from "@/components/ui/Dropdown";

describe("Empirical Challenger M1.2: 3D Flip Card, Dialog, & Dropdown", () => {
  /* ==========================================================================
     1. CSS 3D Flip Card Mechanics & Tokens (src/app/globals.css)
     ========================================================================== */
  describe("CSS 3D Flip Card Classes & Mechanics", () => {
    let cssContent: string;

    beforeEach(() => {
      // `globals.css` nằm trong route group `[locale]` vì layout gốc import
      // qua `src/app/layout.tsx` -> `./[locale]/globals.css`.
      const cssPath = path.resolve(
        __dirname,
        "../../src/app/[locale]/globals.css"
      );
      cssContent = fs.readFileSync(cssPath, "utf-8");
    });

    it("verifies perspective container definitions (.perspective-1000)", () => {
      expect(cssContent).toMatch(/\.perspective-1000\s*\{[^}]*perspective:\s*1000px;/);
      expect(cssContent).toMatch(/\.perspective-1000\s*\{[^}]*-webkit-perspective:\s*1000px;/);
    });

    it("verifies 3D context preservation (.transform-style-3d)", () => {
      expect(cssContent).toMatch(/\.transform-style-3d\s*\{[^}]*transform-style:\s*preserve-3d;/);
      expect(cssContent).toMatch(/\.transform-style-3d\s*\{[^}]*-webkit-transform-style:\s*preserve-3d;/);
    });

    it("verifies backface culling utilities (.backface-hidden)", () => {
      expect(cssContent).toMatch(/\.backface-hidden\s*\{[^}]*backface-visibility:\s*hidden;/);
      expect(cssContent).toMatch(/\.backface-hidden\s*\{[^}]*-webkit-backface-visibility:\s*hidden;/);
    });

    it("verifies 180-degree and 0-degree rotation classes (.rotate-y-180 and .rotate-y-0)", () => {
      expect(cssContent).toMatch(/\.rotate-y-180\s*\{[^}]*transform:\s*rotateY\(180deg\);/);
      expect(cssContent).toMatch(/\.rotate-y-180\s*\{[^}]*-webkit-transform:\s*rotateY\(180deg\);/);
      expect(cssContent).toMatch(/\.rotate-y-0\s*\{[^}]*transform:\s*rotateY\(0deg\);/);
      expect(cssContent).toMatch(/\.rotate-y-0\s*\{[^}]*-webkit-transform:\s*rotateY\(0deg\);/);
    });

    it("verifies transition engine (.transition-flip) uses cubic-bezier and will-change", () => {
      expect(cssContent).toMatch(/\.transition-flip\s*\{[^}]*transition:\s*transform\s+0\.4s\s+cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\);/);
      expect(cssContent).toMatch(/\.transition-flip\s*\{[^}]*will-change:\s*transform;/);
    });

    it("verifies GPU hardware acceleration transforms (translate3d) on card faces", () => {
      // Front face hardware acceleration
      expect(cssContent).toMatch(/\.card-face-front\s*\{[^}]*transform:\s*translate3d\(0,\s*0,\s*1px\);/);
      expect(cssContent).toMatch(/\.card-face-front\s*\{[^}]*-webkit-transform:\s*translate3d\(0,\s*0,\s*1px\);/);

      // Back face rotation + hardware acceleration
      expect(cssContent).toMatch(/\.card-face-back\s*\{[^}]*transform:\s*rotateY\(180deg\)\s+translate3d\(0,\s*0,\s*1px\);/);
      expect(cssContent).toMatch(/\.card-face-back\s*\{[^}]*-webkit-transform:\s*rotateY\(180deg\)\s+translate3d\(0,\s*0,\s*1px\);/);
    });

    it("verifies reduced motion media query overrides transition duration", () => {
      expect(cssContent).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.transition-flip[\s\S]*?transition:\s*transform\s+0\.01ms\s*!important;/);
    });

    it("simulates interactive 3D card component flip toggle", () => {
      function FlipCardSimulator() {
        const [isFlipped, setIsFlipped] = useState(false);
        return (
          <div className="perspective-1000 w-[500px] h-[320px]" data-testid="card-container">
            <div
              data-testid="card-inner"
              onClick={() => setIsFlipped(!isFlipped)}
              className={`transform-style-3d transition-flip ${isFlipped ? "rotate-y-180" : "rotate-y-0"}`}
            >
              <div className="card-face card-face-front" data-testid="card-front">
                Front Term
              </div>
              <div className="card-face card-face-back" data-testid="card-back">
                Back Definition
              </div>
            </div>
          </div>
        );
      }

      render(<FlipCardSimulator />);

      const inner = screen.getByTestId("card-inner");
      expect(inner).toHaveClass("transform-style-3d");
      expect(inner).toHaveClass("transition-flip");
      expect(inner).toHaveClass("rotate-y-0");
      expect(inner).not.toHaveClass("rotate-y-180");

      // Flip card
      fireEvent.click(inner);
      expect(inner).toHaveClass("rotate-y-180");
      expect(inner).not.toHaveClass("rotate-y-0");

      // Flip back
      fireEvent.click(inner);
      expect(inner).toHaveClass("rotate-y-0");
      expect(inner).not.toHaveClass("rotate-y-180");
    });
  });

  /* ==========================================================================
     2. Dialog Component Accessibility & Lifecycle Stress Tests
     ========================================================================== */
  describe("Dialog Component Accessibility, Portal & Lifecycle", () => {
    let originalBodyOverflow: string;

    beforeEach(() => {
      originalBodyOverflow = document.body.style.overflow;
    });

    afterEach(() => {
      document.body.style.overflow = originalBodyOverflow;
    });

    it("verifies dialog renders inside portal (document.body) and outside normal container", () => {
      const { container } = render(
        <div data-testid="parent-container">
          <Dialog isOpen={true} onClose={vi.fn()} title="Portal Test">
            <p>Portal Content</p>
          </Dialog>
        </div>
      );

      const backdrop = screen.getByTestId("dialog-backdrop");
      const dialog = screen.getByRole("dialog");

      // Verifies portal target is document.body
      expect(document.body.contains(backdrop)).toBe(true);
      expect(backdrop.parentElement).toBe(document.body);

      // Verifies it is NOT rendered inside the parent component's DOM container
      const parentContainer = screen.getByTestId("parent-container");
      expect(parentContainer.contains(backdrop)).toBe(false);
      expect(container.contains(dialog)).toBe(false);
    });

    it("verifies Escape key triggers onClose", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Escape Test">
          Dialog Body
        </Dialog>
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("verifies non-Escape keys do NOT trigger onClose", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Key Test">
          Dialog Body
        </Dialog>
      );

      fireEvent.keyDown(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "Tab" });
      fireEvent.keyDown(window, { key: " " });
      fireEvent.keyDown(window, { key: "ArrowDown" });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it("verifies closeOnEsc=false suppresses Escape key closure", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} closeOnEsc={false} title="No ESC">
          Dialog Body
        </Dialog>
      );

      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).not.toHaveBeenCalled();
    });

    it("verifies clicking backdrop triggers onClose, but clicking inside panel does NOT", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Backdrop Click Test">
          <button data-testid="inside-btn">Inner Action</button>
        </Dialog>
      );

      // Clicking panel inside must NOT close
      fireEvent.click(screen.getByTestId("dialog-panel"));
      expect(handleClose).not.toHaveBeenCalled();

      // Clicking child button inside must NOT close
      fireEvent.click(screen.getByTestId("inside-btn"));
      expect(handleClose).not.toHaveBeenCalled();

      // Clicking title inside must NOT close
      fireEvent.click(screen.getByText("Backdrop Click Test"));
      expect(handleClose).not.toHaveBeenCalled();

      // Clicking backdrop directly triggers onClose
      fireEvent.click(screen.getByTestId("dialog-backdrop"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("verifies closeOnOverlayClick=false prevents backdrop click closure", () => {
      const handleClose = vi.fn();
      render(
        <Dialog
          isOpen={true}
          onClose={handleClose}
          closeOnOverlayClick={false}
          title="Persistent Dialog"
        >
          Persistent Content
        </Dialog>
      );

      fireEvent.click(screen.getByTestId("dialog-backdrop"));
      expect(handleClose).not.toHaveBeenCalled();
    });

    it("verifies body scroll lock is set on open and cleaned up on unmount", () => {
      document.body.style.overflow = "visible";

      const { unmount } = render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Scroll Lock Test">
          Scroll Body
        </Dialog>
      );

      // When open, overflow must be hidden
      expect(document.body.style.overflow).toBe("hidden");

      // On unmount while open, previous overflow must be restored
      unmount();
      expect(document.body.style.overflow).toBe("visible");
    });

    it("verifies body scroll lock restores accurately when initial overflow was 'scroll'", () => {
      document.body.style.overflow = "scroll";

      const { rerender } = render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Custom Overflow">
          Custom Overflow Content
        </Dialog>
      );

      expect(document.body.style.overflow).toBe("hidden");

      // Close dialog via isOpen=false
      rerender(
        <Dialog isOpen={false} onClose={vi.fn()} title="Custom Overflow">
          Custom Overflow Content
        </Dialog>
      );

      expect(document.body.style.overflow).toBe("scroll");
    });

    it("verifies multiple sequential dialog mount/unmount cycles do not leak body scroll lock", () => {
      document.body.style.overflow = "";

      // Cycle 1
      const res1 = render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Cycle 1">
          Content 1
        </Dialog>
      );
      expect(document.body.style.overflow).toBe("hidden");
      res1.unmount();
      expect(document.body.style.overflow).toBe("");

      // Cycle 2
      const res2 = render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Cycle 2">
          Content 2
        </Dialog>
      );
      expect(document.body.style.overflow).toBe("hidden");
      res2.unmount();
      expect(document.body.style.overflow).toBe("");
    });

    it("verifies WCAG accessibility attributes (role, aria-modal, aria-labelledby, aria-describedby)", () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Accessible Title"
          description="Detailed guidance for users"
        >
          Accessible Content
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
      expect(dialog).toHaveAttribute("aria-describedby", "dialog-description");

      expect(screen.getByText("Accessible Title")).toHaveAttribute("id", "dialog-title");
      expect(screen.getByText("Detailed guidance for users")).toHaveAttribute("id", "dialog-description");
    });

    it("renders DialogHeader and DialogFooter subcomponents properly", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()}>
          <DialogHeader data-testid="dialog-header">Custom Header</DialogHeader>
          <div>Body Area</div>
          <DialogFooter data-testid="dialog-footer">Custom Footer</DialogFooter>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-header")).toHaveTextContent("Custom Header");
      expect(screen.getByTestId("dialog-footer")).toHaveTextContent("Custom Footer");
    });
  });

  /* ==========================================================================
     3. Dropdown Component Interaction & Lifecycle Stress Tests
     ========================================================================== */
  describe("Dropdown Component Interactions, Outside Click, & Keyboard", () => {
    it("toggles menu on trigger click and displays items", () => {
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[
            { label: "Duplicate", onClick: vi.fn() },
            { label: "Delete", onClick: vi.fn(), variant: "danger" },
          ]}
        />
      );

      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Open
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();

      // Close by clicking trigger again
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("closes menu when outside click (mousedown) occurs", () => {
      render(
        <div>
          <div data-testid="outside-box">External Area</div>
          <Dropdown
            trigger={<button>Menu</button>}
            items={[{ label: "Profile", onClick: vi.fn() }]}
          />
        </div>
      );

      // Open dropdown
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Click outside triggers mousedown listener
      fireEvent.mouseDown(screen.getByTestId("outside-box"));
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("does NOT close menu when clicking inside the dropdown menu (e.g. non-action labels)", () => {
      render(
        <Dropdown trigger={<button>Menu</button>}>
          <DropdownLabel>Section 1</DropdownLabel>
          <DropdownItem label="Item 1" onClick={vi.fn()} />
        </Dropdown>
      );

      // Open
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Clicking label inside menu should not close it
      fireEvent.mouseDown(screen.getByText("Section 1"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("closes menu on Escape key press, but ignores other keys", () => {
      render(
        <Dropdown
          trigger={<button>Options</button>}
          items={[{ label: "Export" }]}
        />
      );

      // Open
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Non-escape keys should not close
      fireEvent.keyDown(window, { key: "Enter" });
      fireEvent.keyDown(window, { key: "Tab" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Escape closes
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("calls item onClick and closes menu on item click", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[{ label: "Select Me", onClick: handleSelect }]}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      fireEvent.click(screen.getByText("Select Me"));

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("respects disabled item state (does not fire click callback)", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[{ label: "Disabled Item", onClick: handleSelect, disabled: true }]}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      const btn = screen.getByRole("menuitem", { name: /disabled item/i });
      expect(btn).toBeDisabled();

      fireEvent.click(btn);
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it("supports controlled isOpen and onOpenChange callback", () => {
      const handleOpenChange = vi.fn();
      const { rerender } = render(
        <Dropdown
          isOpen={false}
          onOpenChange={handleOpenChange}
          trigger={<button>Controlled</button>}
          items={[{ label: "Item" }]}
        />
      );

      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Click trigger in controlled mode
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(handleOpenChange).toHaveBeenCalledWith(true);

      // Parent updates isOpen to true
      rerender(
        <Dropdown
          isOpen={true}
          onOpenChange={handleOpenChange}
          trigger={<button>Controlled</button>}
          items={[{ label: "Item" }]}
        />
      );
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Press Escape in controlled mode
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });

    it("applies align='right' and align='left' classes accurately", () => {
      const { rerender } = render(
        <Dropdown
          align="right"
          isOpen={true}
          trigger={<button>Align</button>}
          items={[{ label: "Item" }]}
        />
      );
      expect(screen.getByTestId("dropdown-menu")).toHaveClass("right-0");
      expect(screen.getByTestId("dropdown-menu")).not.toHaveClass("left-0");

      rerender(
        <Dropdown
          align="left"
          isOpen={true}
          trigger={<button>Align</button>}
          items={[{ label: "Item" }]}
        />
      );
      expect(screen.getByTestId("dropdown-menu")).toHaveClass("left-0");
      expect(screen.getByTestId("dropdown-menu")).not.toHaveClass("right-0");
    });

    it("renders custom children with DropdownItem, DropdownLabel, and DropdownDivider", () => {
      render(
        <Dropdown isOpen={true} trigger={<button>Custom</button>}>
          <DropdownLabel>User Account</DropdownLabel>
          <DropdownItem
            label="Settings"
            icon={<span data-testid="item-icon">*</span>}
          />
          <DropdownDivider />
          <DropdownItem label="Logout" variant="danger" />
        </Dropdown>
      );

      expect(screen.getByText("User Account")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByTestId("item-icon")).toBeInTheDocument();
      expect(screen.getByRole("separator")).toBeInTheDocument();
      const logoutBtn = screen.getByRole("menuitem", { name: /logout/i });
      expect(logoutBtn).toHaveClass("text-quizlet-coral");
    });
  });
});
