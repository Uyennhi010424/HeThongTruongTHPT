import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  it("should render loading text", () => {
    render(<Loading />);
    expect(screen.getByText("Đang tải...")).toBeInTheDocument();
  });

  it("should render a div element", () => {
    const { container } = render(<Loading />);
    expect(container.firstChild.tagName).toBe("DIV");
  });
});
