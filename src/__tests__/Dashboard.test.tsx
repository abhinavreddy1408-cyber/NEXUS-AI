import { render, screen } from "@testing-library/react";
import Dashboard from "@/app/page";

describe("Dashboard Component", () => {
  it("renders without crashing", () => {
    render(<Dashboard />);
    expect(screen.getByText(/Nexus AI/i)).toBeInTheDocument();
  });
});
