import React, { useRef, useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Dialog } from "@/components/ui/Dialog";

describe("Milestone 1 Iteration 2: Dropdown & Dialog Accessibility Stress Harness", () => {
  /* ==========================================================================
     1. Dropdown Keyboard Navigation & Accessibility Stress Tests
     ========================================================================== */
  describe("Dropdown Accessibility & Keyboard Stress", () => {
    it("opens menu via Enter, Space, and ArrowDown on trigger", () => {
      const { rerender } = render(
        <Dropdown
          trigger={<button>Dropdown Trigger</button>}
          items={[
            { label: "Item 1" },
            { label: "Item 2" },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // 1. Open with Enter
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Close with Enter
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      // 2. Open with Space
      fireEvent.keyDown(trigger, { key: " " });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Close with Space
      fireEvent.keyDown(trigger, { key: " " });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // 3. Open with ArrowDown
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("dismisses menu via Escape and returns focus to trigger button", () => {
      render(
        <div>
          <button data-testid="outside-button">Outside</button>
          <Dropdown
            trigger={<button data-testid="my-trigger-btn">Menu Trigger</button>}
            items={[
              { label: "Alpha" },
              { label: "Beta" },
            ]}
          />
        </div>
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      trigger.focus();
      expect(document.activeElement).toBe(trigger);

      // Open via Enter
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Move focus inside menu to "Alpha"
      const alphaItem = screen.getByRole("menuitem", { name: /alpha/i });
      alphaItem.focus();
      expect(document.activeElement).toBe(alphaItem);

      // Press Escape from within the menu
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("executes menu item callbacks via Enter and Space, then closes and restores focus", () => {
      const handleSelect1 = vi.fn();
      const handleSelect2 = vi.fn();

      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[
            { label: "Save", onClick: handleSelect1 },
            { label: "Publish", onClick: handleSelect2 },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");

      // Open and activate "Save" via Enter
      fireEvent.keyDown(trigger, { key: "Enter" });
      const saveItem = screen.getByRole("menuitem", { name: /save/i });
      fireEvent.keyDown(saveItem, { key: "Enter" });
      expect(handleSelect1).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);

      // Open and activate "Publish" via Space
      fireEvent.keyDown(trigger, { key: " " });
      const publishItem = screen.getByRole("menuitem", { name: /publish/i });
      fireEvent.keyDown(publishItem, { key: " " });
      expect(handleSelect2).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });

    it("does not activate disabled items via Enter or Space and keeps menu open", () => {
      const handleDisabled = vi.fn();
      render(
        <Dropdown
          trigger={<button>Actions</button>}
          items={[
            { label: "Locked", onClick: handleDisabled, disabled: true },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.keyDown(trigger, { key: "Enter" });

      const lockedItem = screen.getByRole("menuitem", { name: /locked/i });
      expect(lockedItem).toBeDisabled();

      fireEvent.keyDown(lockedItem, { key: "Enter" });
      expect(handleDisabled).not.toHaveBeenCalled();
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      fireEvent.keyDown(lockedItem, { key: " " });
      expect(handleDisabled).not.toHaveBeenCalled();
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("navigates and cycles across menu items with ArrowDown and ArrowUp, wrapping around and skipping disabled items", () => {
      render(
        <Dropdown
          trigger={<button>Menu</button>}
          items={[
            { label: "Active 1" },
            { label: "Disabled 2", disabled: true },
            { label: "Active 3" },
            { label: "Disabled 4", disabled: true },
            { label: "Active 5" },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      const menu = screen.getByTestId("dropdown-menu");

      const item1 = screen.getByRole("menuitem", { name: /active 1/i });
      const item3 = screen.getByRole("menuitem", { name: /active 3/i });
      const item5 = screen.getByRole("menuitem", { name: /active 5/i });

      // Focus first active item
      item1.focus();
      expect(document.activeElement).toBe(item1);

      // ArrowDown must skip Disabled 2 and focus Active 3
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(item3);

      // ArrowDown must skip Disabled 4 and focus Active 5
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(item5);

      // ArrowDown on last active item must wrap around to Active 1
      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(item1);

      // ArrowUp on first active item must wrap around backwards to Active 5
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(item5);

      // ArrowUp from Active 5 must skip Disabled 4 and focus Active 3
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(item3);

      // ArrowUp from Active 3 must skip Disabled 2 and focus Active 1
      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(item1);
    });

    it("handles arrow navigation gracefully when all items are disabled", () => {
      render(
        <Dropdown
          trigger={<button>Menu</button>}
          items={[
            { label: "Disabled A", disabled: true },
            { label: "Disabled B", disabled: true },
          ]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.keyDown(trigger, { key: "Enter" });
      const menu = screen.getByTestId("dropdown-menu");

      // ArrowDown with no active items should not throw
      expect(() => {
        fireEvent.keyDown(menu, { key: "ArrowDown" });
        fireEvent.keyDown(menu, { key: "ArrowUp" });
      }).not.toThrow();
    });

    it("handles single-item navigation cycling to itself", () => {
      render(
        <Dropdown
          trigger={<button>Menu</button>}
          items={[{ label: "Solo Item" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      fireEvent.keyDown(trigger, { key: "Enter" });
      const menu = screen.getByTestId("dropdown-menu");
      const solo = screen.getByRole("menuitem", { name: /solo item/i });

      solo.focus();
      expect(document.activeElement).toBe(solo);

      fireEvent.keyDown(menu, { key: "ArrowDown" });
      expect(document.activeElement).toBe(solo);

      fireEvent.keyDown(menu, { key: "ArrowUp" });
      expect(document.activeElement).toBe(solo);
    });
  });

  /* ==========================================================================
     2. Dialog Focus Management & Trap Stress Tests
     ========================================================================== */
  describe("Dialog Focus Management & Trap Stress", () => {
    let originalOverflow: string;

    beforeEach(() => {
      originalOverflow = document.body.style.overflow;
    });

    afterEach(() => {
      document.body.style.overflow = originalOverflow;
    });

    it("focuses designated element via initialFocusRef upon mount", () => {
      function DialogWithExplicitFocus() {
        const primaryInputRef = useRef<HTMLInputElement>(null);
        return (
          <Dialog isOpen={true} onClose={vi.fn()} initialFocusRef={primaryInputRef}>
            <div>
              <button data-testid="first-btn">First Button</button>
              <input data-testid="first-input" />
              <input ref={primaryInputRef} data-testid="target-input" placeholder="Primary target" />
              <button data-testid="last-btn">Last Button</button>
            </div>
          </Dialog>
        );
      }

      render(<DialogWithExplicitFocus />);
      const targetInput = screen.getByTestId("target-input");
      expect(document.activeElement).toBe(targetInput);
    });

    it("falls back automatically to first interactive child in content when initialFocusRef is omitted", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Auto Fallback Dialog">
          <div>
            <p>Some non-interactive description</p>
            <input data-testid="first-interactive-child" placeholder="Type here" />
            <button data-testid="second-interactive-child">Submit</button>
          </div>
        </Dialog>
      );

      const firstChild = screen.getByTestId("first-interactive-child");
      expect(document.activeElement).toBe(firstChild);
    });

    it("falls back to close button when content has no interactive children", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Informational Modal">
          <div>
            <p>Static informational notice with no buttons or inputs inside body.</p>
          </div>
        </Dialog>
      );

      const closeBtn = screen.getByTestId("dialog-close-btn");
      expect(document.activeElement).toBe(closeBtn);
    });

    it("falls back to panel itself when there are zero interactive elements and close button is disabled", () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          showCloseButton={false}
          title="Pure Static Modal"
        >
          <div>
            <p>Completely static content with no close button.</p>
          </div>
        </Dialog>
      );

      const panel = screen.getByTestId("dialog-panel");
      expect(document.activeElement).toBe(panel);
    });

    it("traps focus inside modal during Tab navigation (forward wrap and reverse wrap)", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} showCloseButton={true}>
          <div data-testid="dialog-body">
            <button data-testid="modal-btn-1">Button 1</button>
            <input data-testid="modal-input-2" placeholder="Input 2" />
            <button data-testid="modal-btn-3">Button 3</button>
          </div>
        </Dialog>
      );

      const closeBtn = screen.getByTestId("dialog-close-btn");
      const btn1 = screen.getByTestId("modal-btn-1");
      const input2 = screen.getByTestId("modal-input-2");
      const btn3 = screen.getByTestId("modal-btn-3");

      // Note: In DOM order: closeBtn is rendered before content inside panelRef.
      // So focusable elements list: [closeBtn, btn1, input2, btn3]
      // Content auto-focus focused btn1 first.
      expect(document.activeElement).toBe(btn1);

      // Focus on the absolute last focusable element (btn3)
      btn3.focus();
      expect(document.activeElement).toBe(btn3);

      // Pressing Tab on last element wraps around to the first element (closeBtn)
      fireEvent.keyDown(window, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);

      // Pressing Shift+Tab on first element wraps around backwards to the last element (btn3)
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(btn3);
    });

    it("redirects focus back into modal when Tab is pressed while focus is outside the modal", () => {
      render(
        <div>
          <button data-testid="background-element">Background</button>
          <Dialog isOpen={true} onClose={vi.fn()} showCloseButton={true}>
            <button data-testid="dialog-action">Action</button>
          </Dialog>
        </div>
      );

      const bgElement = screen.getByTestId("background-element");
      const closeBtn = screen.getByTestId("dialog-close-btn");
      const actionBtn = screen.getByTestId("dialog-action");

      // Force focus outside dialog panel
      bgElement.focus();
      expect(document.activeElement).toBe(bgElement);

      // Normal Tab pulls focus to first element in dialog
      fireEvent.keyDown(window, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);

      // Force focus outside again
      bgElement.focus();
      expect(document.activeElement).toBe(bgElement);

      // Shift+Tab pulls focus to last element in dialog
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(actionBtn);
    });

    it("restores previous focus to the triggering element when modal closes via button, Escape, and props change", () => {
      function FocusRestorationHarness() {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <div>
            <button data-testid="launch-button-1" onClick={() => setIsOpen(true)}>
              Launch Modal 1
            </button>
            <button data-testid="launch-button-2" onClick={() => setIsOpen(true)}>
              Launch Modal 2
            </button>
            <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <button data-testid="modal-dismiss" onClick={() => setIsOpen(false)}>
                Dismiss
              </button>
            </Dialog>
          </div>
        );
      }

      render(<FocusRestorationHarness />);

      // Case 1: Open from button 1, close via dismiss button
      const launchBtn1 = screen.getByTestId("launch-button-1");
      launchBtn1.focus();
      expect(document.activeElement).toBe(launchBtn1);

      fireEvent.click(launchBtn1);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      const dismissBtn = screen.getByTestId("modal-dismiss");
      fireEvent.click(dismissBtn);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(launchBtn1);

      // Case 2: Open from button 2, close via Escape key
      const launchBtn2 = screen.getByTestId("launch-button-2");
      launchBtn2.focus();
      expect(document.activeElement).toBe(launchBtn2);

      fireEvent.click(launchBtn2);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(launchBtn2);
    });

    it("handles previous focus restoration when triggering element was removed from DOM", () => {
      function DynamicTriggerHarness() {
        const [showTrigger, setShowTrigger] = useState(true);
        const [isOpen, setIsOpen] = useState(false);

        return (
          <div>
            {showTrigger ? (
              <button
                data-testid="temporary-trigger"
                onClick={() => {
                  setShowTrigger(false);
                  setIsOpen(true);
                }}
              >
                Trigger & Remove
              </button>
            ) : null}
            <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <button data-testid="close-dialog" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </Dialog>
          </div>
        );
      }

      render(<DynamicTriggerHarness />);
      const tempTrigger = screen.getByTestId("temporary-trigger");
      tempTrigger.focus();

      fireEvent.click(tempTrigger);
      expect(screen.queryByTestId("temporary-trigger")).not.toBeInTheDocument();
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Closing should not crash or throw even though previousActiveElement is disconnected
      expect(() => {
        fireEvent.click(screen.getByTestId("close-dialog"));
      }).not.toThrow();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
