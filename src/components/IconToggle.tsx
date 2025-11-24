interface IconToggleProps {
   checked: boolean;
   checkIcon: React.ReactNode;
   unCheckIcon: React.ReactNode;
   onChange: (value: boolean) => void;
   className?: string;
}

export default function IconToggle({
   checked,
   onChange,
   checkIcon,
   unCheckIcon,
   className,
}: IconToggleProps) {
   const toggle = () => {
      onChange(!checked);
   };

   return (
      <button
         onClick={toggle}
         className={`
        ex-tw-flex ex-tw-items-center ex-tw-justify-center
        ex-tw-w-10 ex-tw-h-10
        ex-tw-rounded-xl
        ex-tw-border ex-tw-border-border1
        ex-tw-bg-white
        ex-tw-shadow-sm ex-tw-outline-none
        ex-tw-transition-all ex-tw-duration-150
        hover:ex-tw-bg-gray-50
        active:ex-tw-scale-95

        /* 🌑 다크모드 */
        dark:ex-tw-bg-gray-800
        dark:ex-tw-border-gray-600
        dark:hover:ex-tw-bg-gray-700
        dark:ex-tw-text-white

        ${className ?? ""}
      `}
      >
         {checked ? checkIcon : unCheckIcon}
      </button>
   );
}
