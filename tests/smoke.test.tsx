import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConfirmDialog } from "../src/components/common/ConfirmDialog";
import { CategoryBadge, RoleBadge, ShiftBadge } from "../src/components/common/Badges";
import { CodeText } from "../src/components/common/CodeText";
import { DateRangeFilter, presetRange } from "../src/components/common/DateRangeFilter";
import { EmptyState } from "../src/components/common/EmptyState";
import { ErrorState } from "../src/components/common/ErrorState";
import { FractionText } from "../src/components/common/FractionText";
import { HighlightedText } from "../src/components/common/HighlightedText";
import { InlineLoader } from "../src/components/common/LoadingScreen";
import { PaginationBar } from "../src/components/common/PaginationBar";
import { SearchInput } from "../src/components/common/SearchInput";
import { StatCard } from "../src/components/common/StatCard";
import { BarChart3 } from "../src/components/icons";
import { makeCategory, makeRole } from "./factories";

afterEach(() => cleanup());

describe("common components render without runtime errors", () => {
  it("renders text helpers", () => {
    render(
      <div>
        <FractionText value="1/2" />
        <CodeText code="A1-L12-BM-1011 1/2" />
        <HighlightedText text="A1-L12-BM-1011" query="L12" />
      </div>,
    );
    expect(document.body.textContent).toContain("A1-L12-BM-1011");
  });

  it("renders badges", () => {
    render(
      <div>
        <CategoryBadge category={makeCategory({ id: "blasting", name: "Blasting" })} />
        <ShiftBadge shift="night" />
        <RoleBadge role={makeRole({ id: "admin-standard", name: "Admin" })} />
      </div>,
    );
    expect(screen.getByText("Blasting")).toBeInTheDocument();
    expect(screen.getByText("রাত")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders StatCard and EmptyState", () => {
    render(
      <div>
        <StatCard label="মোট তালিকা" value={12} icon={BarChart3} tone="accent" />
        <EmptyState title="কিছু নেই" description="খালি" />
      </div>,
    );
    expect(screen.getByText("মোট তালিকা")).toBeInTheDocument();
    expect(screen.getByText("কিছু নেই")).toBeInTheDocument();
  });

  it("renders loaders and error state", () => {
    render(
      <div>
        <InlineLoader label="লোড হচ্ছে..." />
        <ErrorState message="সমস্যা" />
      </div>,
    );
    expect(screen.getByText("লোড হচ্ছে...")).toBeInTheDocument();
    expect(screen.getByText("সমস্যা")).toBeInTheDocument();
  });

  it("renders pagination and search controls", () => {
    render(
      <div>
        <PaginationBar page={1} pageCount={3} onChange={() => undefined} totalItems={25} />
        <SearchInput value="" onChange={() => undefined} placeholder="খুঁজুন..." />
      </div>,
    );
    expect(screen.getByLabelText("পরের পৃষ্ঠা")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("খুঁজুন...")).toBeInTheDocument();
  });

  it("renders the confirm dialog when open", () => {
    render(
      <ConfirmDialog
        isOpen
        onOpenChange={() => undefined}
        title="নিশ্চিত?"
        message="মুছে ফেলবেন?"
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByText("নিশ্চিত?")).toBeInTheDocument();
    expect(screen.getByText("নিশ্চিত করুন")).toBeInTheDocument();
  });

  it("renders the date range filter with presets", () => {
    const range = presetRange("30");
    render(<DateRangeFilter value={range} onChange={() => undefined} />);
    expect(screen.getByText("৩০ দিন")).toBeInTheDocument();
    expect(screen.getByText("সব")).toBeInTheDocument();
  });

  it("computes preset ranges", () => {
    const seven = presetRange("7");
    expect(seven.from).not.toBeNull();
    expect(seven.to).not.toBeNull();
    expect(presetRange("all")).toEqual({ preset: "all", from: null, to: null });
  });
});
