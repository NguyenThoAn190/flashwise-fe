import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Dropdown } from "@/components/ui/Dropdown";

describe("UI Primitives Test Suite", () => {
  /* ==========================================================================
     1. Button Component
     ========================================================================== */
  describe("Button", () => {
    it("renders button children correctly", () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    });

    it("handles click events when enabled", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit</Button>);
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire click events when disabled", () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const btn = screen.getByRole("button", { name: /disabled/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("displays loading spinner and is disabled when isLoading is true", () => {
      const handleClick = vi.fn();
      render(<Button isLoading onClick={handleClick}>Loading State</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-busy", "true");
      expect(screen.getByTestId("button-spinner")).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("applies variant classes correctly", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-quizlet-indigo");

      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button")).toHaveClass("border-quizlet-border");

      rerender(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-transparent");

      rerender(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-quizlet-coral");
    });

    it("renders left and right icons", () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          With Icons
        </Button>
      );
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     2. Input Component
     ========================================================================== */
  describe("Input", () => {
    it("renders input with placeholder and label", () => {
      render(<Input label="Study Set Title" placeholder="Enter title..." />);
      expect(screen.getByLabelText(/study set title/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter title\.\.\./i)).toBeInTheDocument();
    });

    it("handles onChange typing events", () => {
      const handleChange = vi.fn();
      render(<Input placeholder="Type here" onChange={handleChange} />);
      const input = screen.getByPlaceholderText(/type here/i);
      fireEvent.change(input, { target: { value: "Biology 101" } });
      expect(handleChange).toHaveBeenCalled();
      expect((input as HTMLInputElement).value).toBe("Biology 101");
    });

    it("renders error state and error message when error prop is provided", () => {
      render(<Input label="Email" error="Email is required" placeholder="you@quizlet.com" />);
      const input = screen.getByPlaceholderText(/you@quizlet\.com/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveClass("border-quizlet-coral");
      expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
    });

    it("renders helperText when no error is present", () => {
      render(<Input label="Username" helperText="Must be at least 3 characters" />);
      expect(screen.getByText("Must be at least 3 characters")).toBeInTheDocument();
    });

    it("respects disabled attribute", () => {
      render(<Input disabled placeholder="Cannot type" />);
      expect(screen.getByPlaceholderText(/cannot type/i)).toBeDisabled();
    });
  });

  /* ==========================================================================
     3. Badge Component
     ========================================================================== */
  describe("Badge", () => {
    it("renders term count text correctly", () => {
      render(<Badge>25 terms</Badge>);
      expect(screen.getByText("25 terms")).toBeInTheDocument();
    });

    it("applies status color styles", () => {
      const { rerender } = render(<Badge status="MASTERED">Mastered</Badge>);
      expect(screen.getByText("Mastered")).toHaveClass("text-quizlet-green");

      rerender(<Badge status="LEARNING">Learning</Badge>);
      expect(screen.getByText("Learning")).toHaveClass("text-quizlet-coral");

      rerender(<Badge status="NEW">New</Badge>);
      expect(screen.getByText("New")).toHaveClass("text-quizlet-indigo");
    });

    it("renders dot indicator when showDot is true", () => {
      render(<Badge status="MASTERED" showDot>Mastered</Badge>);
      expect(screen.getByTestId("badge-dot")).toBeInTheDocument();
    });
  });

  /* ==========================================================================
     4. Dialog Component
     ========================================================================== */
  describe("Dialog", () => {
    it("does not render content when isOpen is false", () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()} title="Modal Title">
          Modal Body
        </Dialog>
      );
      expect(screen.queryByText("Modal Title")).not.toBeInTheDocument();
      expect(screen.queryByText("Modal Body")).not.toBeInTheDocument();
    });

    it("renders title and content when isOpen is true", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Import Cards">
          <p>Import text area</p>
        </Dialog>
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Import Cards")).toBeInTheDocument();
      expect(screen.getByText("Import text area")).toBeInTheDocument();
    });

    it("calls onClose when close button is clicked", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Import Cards">
          Content
        </Dialog>
      );
      fireEvent.click(screen.getByTestId("dialog-close-btn"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Escape key is pressed", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Import Cards">
          Content
        </Dialog>
      );
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when backdrop overlay is clicked", () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Import Cards">
          Content
        </Dialog>
      );
      fireEvent.click(screen.getByTestId("dialog-backdrop"));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("manages initial focus by focusing the specified initialFocusRef element", () => {
      function DialogWithInitialFocus() {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return (
          <Dialog isOpen={true} onClose={vi.fn()} initialFocusRef={inputRef}>
            <input data-testid="other-input" />
            <input ref={inputRef} data-testid="target-input" />
          </Dialog>
        );
      }
      render(<DialogWithInitialFocus />);
      expect(document.activeElement).toBe(screen.getByTestId("target-input"));
    });

    it("automatically focuses the first focusable element inside dialog when opened without initialFocusRef", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} title="Auto Focus Test">
          <button data-testid="first-action">First Action</button>
          <button data-testid="second-action">Second Action</button>
        </Dialog>
      );
      expect(document.activeElement).toBe(screen.getByTestId("first-action"));
    });

    it("restores focus to previously active element when dialog closes", () => {
      function TestComponent() {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button data-testid="open-btn" onClick={() => setOpen(true)}>
              Open Modal
            </button>
            <Dialog isOpen={open} onClose={() => setOpen(false)}>
              <button data-testid="dialog-btn" onClick={() => setOpen(false)}>
                Dismiss
              </button>
            </Dialog>
          </div>
        );
      }
      render(<TestComponent />);
      const openBtn = screen.getByTestId("open-btn");
      openBtn.focus();
      expect(document.activeElement).toBe(openBtn);

      // Open dialog
      fireEvent.click(openBtn);
      expect(document.activeElement).toBe(screen.getByTestId("dialog-btn"));

      // Close dialog
      fireEvent.click(screen.getByTestId("dialog-btn"));
      expect(document.activeElement).toBe(openBtn);
    });

    it("traps focus within dialog during Tab and Shift+Tab navigation", () => {
      render(
        <Dialog isOpen={true} onClose={vi.fn()} showCloseButton={true}>
          <input data-testid="input-1" />
          <button data-testid="btn-2">Action</button>
        </Dialog>
      );

      const closeBtn = screen.getByTestId("dialog-close-btn");
      const input1 = screen.getByTestId("input-1");
      const btn2 = screen.getByTestId("btn-2");

      // Active element is input-1 initially
      expect(document.activeElement).toBe(input1);

      // Focus on last element (btn2) and press Tab -> wraps to first element (closeBtn)
      btn2.focus();
      expect(document.activeElement).toBe(btn2);
      fireEvent.keyDown(window, { key: "Tab" });
      expect(document.activeElement).toBe(closeBtn);

      // Focus on first element (closeBtn) and press Shift+Tab -> wraps to last element (btn2)
      closeBtn.focus();
      expect(document.activeElement).toBe(closeBtn);
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
      expect(document.activeElement).toBe(btn2);
    });
  });

  /* ==========================================================================
     5. Dropdown Component
     ========================================================================== */
  describe("Dropdown", () => {
    it("renders trigger and opens menu on click", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<button>+ Create</button>}
          items={[
            { label: "Study Set", onClick: handleSelect },
            { label: "Folder", onClick: vi.fn() },
          ]}
        />
      );

      expect(screen.getByText("+ Create")).toBeInTheDocument();
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Click trigger opens menu
      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(screen.getByText("Study Set")).toBeInTheDocument();
      expect(screen.getByText("Folder")).toBeInTheDocument();

      // Click item executes callback and closes menu
      fireEvent.click(screen.getByText("Study Set"));
      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("closes menu on Escape key press", () => {
      render(
        <Dropdown
          trigger={<button>Profile</button>}
          items={[{ label: "Settings" }]}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-trigger"));
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("renders trigger with accessible attributes (role='button', tabIndex=0, aria-haspopup, aria-expanded)", () => {
      render(
        <Dropdown
          trigger={<span>Menu</span>}
          items={[{ label: "Option 1" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      expect(trigger).toHaveAttribute("role", "button");
      expect(trigger).toHaveAttribute("tabIndex", "0");
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles menu when pressing Enter on trigger", () => {
      render(
        <Dropdown
          trigger={<span>Actions</span>}
          items={[{ label: "Export" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Press Enter to open
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      // Press Enter again to close
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles menu when pressing Space on trigger", () => {
      render(
        <Dropdown
          trigger={<span>Actions</span>}
          items={[{ label: "Export" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();

      // Press Space to open
      fireEvent.keyDown(trigger, { key: " " });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      // Press Space again to close
      fireEvent.keyDown(trigger, { key: " " });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("activates menu items with Enter key and closes menu", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<span>Actions</span>}
          items={[{ label: "Duplicate", onClick: handleSelect }]}
        />
      );

      // Open menu via keyboard Enter
      fireEvent.keyDown(screen.getByTestId("dropdown-trigger"), { key: "Enter" });
      const menuItem = screen.getByRole("menuitem", { name: /duplicate/i });
      expect(menuItem).toBeInTheDocument();

      // Activate item via Enter key
      fireEvent.keyDown(menuItem, { key: "Enter" });
      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("activates menu items with Space key and closes menu", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<span>Actions</span>}
          items={[{ label: "Share", onClick: handleSelect }]}
        />
      );

      // Open menu via Space
      fireEvent.keyDown(screen.getByTestId("dropdown-trigger"), { key: " " });
      const menuItem = screen.getByRole("menuitem", { name: /share/i });

      // Activate item via Space key
      fireEvent.keyDown(menuItem, { key: " " });
      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
    });

    it("does not activate disabled menu items via keyboard", () => {
      const handleSelect = vi.fn();
      render(
        <Dropdown
          trigger={<span>Actions</span>}
          items={[{ label: "Delete", onClick: handleSelect, disabled: true }]}
        />
      );

      fireEvent.keyDown(screen.getByTestId("dropdown-trigger"), { key: "Enter" });
      const menuItem = screen.getByRole("menuitem", { name: /delete/i });
      expect(menuItem).toBeDisabled();

      fireEvent.keyDown(menuItem, { key: "Enter" });
      fireEvent.keyDown(menuItem, { key: " " });
      expect(handleSelect).not.toHaveBeenCalled();
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();
    });

    it("navigates menu items with ArrowDown and ArrowUp keys", () => {
      render(
        <Dropdown
          trigger={<span>Navigate</span>}
          items={[
            { label: "Item 1" },
            { label: "Item 2" },
            { label: "Item 3" },
          ]}
        />
      );

      fireEvent.keyDown(screen.getByTestId("dropdown-trigger"), { key: "Enter" });
      const items = screen.getAllByRole("menuitem");
      expect(items).toHaveLength(3);

      items[0].focus();
      expect(document.activeElement).toBe(items[0]);

      // ArrowDown moves to second
      fireEvent.keyDown(screen.getByTestId("dropdown-menu"), { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[1]);

      // ArrowDown moves to third
      fireEvent.keyDown(screen.getByTestId("dropdown-menu"), { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[2]);

      // ArrowDown wraps to first
      fireEvent.keyDown(screen.getByTestId("dropdown-menu"), { key: "ArrowDown" });
      expect(document.activeElement).toBe(items[0]);

      // ArrowUp wraps to third
      fireEvent.keyDown(screen.getByTestId("dropdown-menu"), { key: "ArrowUp" });
      expect(document.activeElement).toBe(items[2]);
    });

    it("closes menu on Escape key press and restores focus to trigger", () => {
      render(
        <Dropdown
          trigger={<span>Profile</span>}
          items={[{ label: "Settings" }]}
        />
      );

      const trigger = screen.getByTestId("dropdown-trigger");
      trigger.focus();
      fireEvent.keyDown(trigger, { key: "Enter" });
      expect(screen.getByTestId("dropdown-menu")).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });
  });
});
