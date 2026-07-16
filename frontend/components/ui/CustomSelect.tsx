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
  isDisabled?: boolean;
  isSearchable?: boolean;
  className?: string;
  instanceId?: string;
  variant?: "dark" | "light";
}

const darkStyles: StylesConfig<SelectOption, false> = {
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

const lightStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 40,
    backgroundColor: "rgba(247,242,234,0.75)",
    border: `1px solid ${state.isFocused ? "#c59d5f" : "#d8d2c4"}`,
    borderRadius: 6,
    boxShadow: "none",
    cursor: "pointer",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.12em",

    "&:hover": {
      borderColor: "#c59d5f",
    },
  }),

  valueContainer: (base) => ({
    ...base,
    padding: "0 10px",
  }),

  input: (base) => ({
    ...base,
    color: "#2f261f",
  }),

  placeholder: (base) => ({
    ...base,
    color: "rgba(47,38,31,.55)",
  }),

  singleValue: (base) => ({
    ...base,
    color: "rgba(47,38,31,.72)",
  }),

  menu: (base) => ({
    ...base,
    zIndex: 60,
    backgroundColor: "#f7f2ea",
    border: "1px solid #d8d2c4",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 6,
    boxShadow: "0 16px 35px rgba(47,38,31,.12)",
  }),

  menuList: (base) => ({
    ...base,
    padding: 4,
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: 4,
    cursor: "pointer",
    backgroundColor: state.isFocused ? "rgba(197,157,95,.14)" : "transparent",
    color: "#2f261f",
    fontSize: 13,

    ":active": {
      backgroundColor: "rgba(197,157,95,.22)",
    },
  }),

  dropdownIndicator: (base) => ({
    ...base,
    color: "#8a6a3b",
    paddingLeft: 4,
    paddingRight: 8,

    ":hover": {
      color: "#8a6a3b",
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
  isDisabled = false,
  isSearchable = false,
  className,
  instanceId,
  variant = "dark",
}: CustomSelectProps) {
  return (
    <div className={className}>
      <Select<SelectOption, false>
        instanceId={instanceId}
        options={options}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(option:any) => onChange?.(option)}
        styles={variant === "light" ? lightStyles : darkStyles}
        isDisabled={isDisabled}
        isSearchable={isSearchable}
      />
    </div>
  );
}
