"use client";

import Select, { StylesConfig } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value?: SelectOption | null;
  defaultValue?: SelectOption;
  placeholder?: string;
  onChange?: (option: SelectOption | null) => void;
  isSearchable?: boolean;
  className?: string;
}

const styles: StylesConfig<SelectOption, false> = {
  control: (base:any, state:any) => ({
    ...base,
    minHeight: 52,
    backgroundColor: "rgba(255,255,255,0.05)",
    border: `1px solid ${
      state.isFocused ? "#C9A34A" : "rgba(255,255,255,0.10)"
    }`,
    borderRadius: 12,
    boxShadow: "none",
    cursor: "pointer",
    transition: "all .2s ease",

    "&:hover": {
      borderColor: "#C9A34A",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: "0 14px",
  }),

  input: (base) => ({
    ...base,
    color: "#F7F2EA",
  }),

  placeholder: (base) => ({
    ...base,
    color: "rgba(247,242,234,.45)",
  }),

  singleValue: (base) => ({
    ...base,
    color: "#F7F2EA",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "#171723",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  }),

  menuList: (base) => ({
    ...base,
    padding: 6,
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: 8,
    cursor: "pointer",
    backgroundColor: state.isFocused
      ? "rgba(201,163,74,.12)"
      : "transparent",
    color: "#F7F2EA",

    ":active": {
      backgroundColor: "rgba(201,163,74,.20)",
    },
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: "#C9A34A",

    ":hover": {
      color: "#C9A34A",
    },
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),
};

export default function CustomSelect({
  options,
  value,
  defaultValue,
  placeholder,
  onChange,
  isSearchable = false,
  className,
}: CustomSelectProps) {
  return (
    <div className={className}>
      <Select<SelectOption, false>
        options={options}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(option:any) => onChange?.(option)}
        styles={styles}
        isSearchable={isSearchable}
      />
    </div>
  );
}