import DropdownMenu from "./DropdownMenu";

type CopyFormat = "className" | "apply" | "multiline";

type CopyFormatDropdownProps = {
   buttonLabel: string;
   disabled?: boolean;
   onSelect: (format: CopyFormat) => void;
};

const menuItems: { key: CopyFormat; label: string }[] = [
   { key: "className", label: "Copy as className" },
   { key: "apply", label: "Copy as @apply" },
   { key: "multiline", label: "Copy as multiline" },
];

export default function CopyFormatDropdown({
   buttonLabel,
   disabled = false,
   onSelect,
}: CopyFormatDropdownProps) {
   return (
      <DropdownMenu<CopyFormat>
         options={menuItems}
         onChange={onSelect}
         buttonLabel={buttonLabel}
         disabled={disabled}
         className="ex-tw-flex ex-tw-items-center ex-tw-gap-2"
         buttonClassName="ex-tw-h-10 ex-tw-min-w-40 ex-tw-px-4 ex-tw-rounded-lg ex-tw-text-sm ex-tw-font-medium ex-tw-text-center ex-tw-bg-slate-600 ex-tw-text-white hover:ex-tw-bg-slate-700 disabled:ex-tw-bg-slate-400 disabled:ex-tw-text-slate-200"
         menuClassName="ex-tw-w-40"
         align="right"
         menuWidth={160}
      />
   );
}
