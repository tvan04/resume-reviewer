import { render, screen, fireEvent } from "@testing-library/react";
import { ImageWithFallback } from "../../components/ImageWithFallback";

describe("ImageWithFallback", () => {
  const mockSrc = "https://example.com/test.jpg";
  const mockAlt = "Test image";

  it("renders normally with provided src and alt", () => {
    render(<ImageWithFallback src={mockSrc} alt={mockAlt} />);
    const img = screen.getByAltText(mockAlt) as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe(mockSrc);
  });

  it("renders fallback image after error", () => {
    render(<ImageWithFallback src={mockSrc} alt={mockAlt} />);
    const img = screen.getByAltText(mockAlt);

    // simulate error event
    fireEvent.error(img);

    // the error fallback image should render
    const fallbackImg = screen.getByAltText(/Error loading image/i) as HTMLImageElement;
    expect(fallbackImg).toBeInTheDocument();
    expect(fallbackImg.dataset.originalUrl).toBe(mockSrc);
  });

  it("applies custom className and style correctly", () => {
    const customStyle = { border: "2px solid red" };
    render(
      <ImageWithFallback
        src={mockSrc}
        alt={mockAlt}
        className="custom-class"
        style={customStyle}
      />
    );

    const img = screen.getByAltText(mockAlt);
    expect(img).toHaveClass("custom-class");
    expect(img).toHaveStyle("border: 2px solid red");
  });
});
