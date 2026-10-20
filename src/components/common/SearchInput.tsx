import { SearchField } from "@heroui/react";
import { type ReactNode } from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "সার্চ করুন...",
  label = "সার্চ",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}): ReactNode {
  return (
    <SearchField
      name="search"
      value={value}
      onChange={onChange}
      aria-label={label}
      className={className}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} className="w-full" />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}
