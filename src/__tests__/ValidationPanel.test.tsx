// FILE: src/__tests__/ValidationPanel.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ValidationPanel from "@/components/dashboard/ValidationPanel";
import "@testing-library/jest-dom";

// Mock Fetch
global.fetch = vi.fn();

describe("ValidationPanel", () => {
  const mockUser = { id: "1", role: "OWNER", email: "test@test.com" };

  it("renders initial steps", () => {
    render(<ValidationPanel currentUser={mockUser} />);
    expect(screen.getByText(/data source verified/i)).toBeInTheDocument();
  });

  it("handles undo logic", async () => {
    render(<ValidationPanel currentUser={mockUser} />);

    // Validate first step
    const yesButtons = screen.getAllByLabelText("Validate Yes");
    fireEvent.click(yesButtons[0]);

    // Check updated state
    await waitFor(() => {
      expect(yesButtons[0]).toHaveClass("bg-emerald-600");
    });

    // Click Undo
    const undoBtn = screen.getByLabelText("Undo last action");
    fireEvent.click(undoBtn);

    // Should revert
    await waitFor(() => {
      expect(yesButtons[0]).not.toHaveClass("bg-emerald-600");
    });
  });

  it("opens PIN modal on sign-off", () => {
    render(<ValidationPanel currentUser={mockUser} />);

    // Validate all
    const yesButtons = screen.getAllByLabelText("Validate Yes");
    yesButtons.forEach((btn) => fireEvent.click(btn));

    const signOffBtn = screen.getByText(/Execute Decision/i);
    fireEvent.click(signOffBtn);

    expect(screen.getByText(/Identity Verification/i)).toBeInTheDocument();
  });
});
