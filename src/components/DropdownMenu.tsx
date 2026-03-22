import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type DropdownOption<T extends string = string> = {
   value: T;
   label: string;
   disabled?: boolean;
};

type DropdownMenuProps<T extends string = string> = {
   options: DropdownOption<T>[];
   value?: T;
   onChange: (value: T) => void;
   placeholder?: string;
   buttonLabel?: string;
   disabled?: boolean;
   className?: string;
   buttonClassName?: string;
   menuClassName?: string;
   itemClassName?: string;
   align?: "left" | "right";
   menuWidth?: "trigger" | number;
   offsetY?: number;
};

const defaultButtonClass =
   "ex-tw-h-8 ex-tw-w-full ex-tw-rounded ex-tw-border ex-tw-border-border1 ex-tw-bg-background2 ex-tw-px-2 ex-tw-text-xs ex-tw-text-text1 ex-tw-text-left dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-100 dark:ex-tw-border-slate-700";
const defaultMenuClass =
   "ex-tw-absolute ex-tw-left-0 ex-tw-top-[calc(100%+4px)] ex-tw-w-full ex-tw-rounded-md ex-tw-border ex-tw-border-border1 ex-tw-bg-background1 ex-tw-shadow-lg ex-tw-z-20";
const defaultItemClass =
   "ex-tw-block ex-tw-w-full ex-tw-text-left ex-tw-px-3 ex-tw-py-2 ex-tw-text-xs ex-tw-text-text2 hover:ex-tw-bg-background2";

export default function DropdownMenu<T extends string = string>({
   options,
   value,
   onChange,
   placeholder = "Select",
   buttonLabel,
   disabled = false,
   className = "",
   buttonClassName = "",
   menuClassName = "",
   itemClassName = "",
   align = "left",
   menuWidth = "trigger",
   offsetY = 4,
}: DropdownMenuProps<T>) {
   const [open, setOpen] = useState(false);
   const rootRef = useRef<HTMLDivElement | null>(null);
   const buttonRef = useRef<HTMLButtonElement | null>(null);
   const menuRef = useRef<HTMLDivElement | null>(null);
   const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
      top: 0,
      left: 0,
      width: 0,
   });
   const [openUpward, setOpenUpward] = useState(false);

   const selectedLabel = useMemo(() => {
      const found = options.find((opt) => opt.value === value);
      return found?.label;
   }, [options, value]);
   const portalDoc = buttonRef.current?.ownerDocument ?? document;
   const portalWin = portalDoc.defaultView ?? window;

   useEffect(() => {
      if (!open) return;
      const rootEl = rootRef.current;
      const menuEl = menuRef.current;
      if (!rootEl || !menuEl) return;

      const docs: Document[] = [document];
      const ownerDoc = menuEl.ownerDocument;
      if (ownerDoc && ownerDoc !== document) docs.push(ownerDoc);

      const onDown = (e: MouseEvent | TouchEvent) => {
         const targetEl = e.target as Node | null;
         if (targetEl && !menuEl.contains(targetEl) && !rootEl.contains(targetEl)) {
            setOpen(false);
         }
      };

      docs.forEach((doc) => {
         doc.addEventListener("mousedown", onDown as EventListener, true);
         doc.addEventListener("touchstart", onDown as EventListener, true);
      });

      return () => {
         docs.forEach((doc) => {
            doc.removeEventListener("mousedown", onDown as EventListener, true);
            doc.removeEventListener("touchstart", onDown as EventListener, true);
         });
      };
   }, [open, portalDoc]);

   useEffect(() => {
      if (!open) return;

      const updatePosition = () => {
         const trigger = buttonRef.current;
         if (!trigger) return;
         const rect = trigger.getBoundingClientRect();
         const width = menuWidth === "trigger" ? rect.width : menuWidth;
         const preferredLeft = align === "right" ? rect.right - width : rect.left;
         const viewportWidth = portalWin.innerWidth;
         const clampedLeft = Math.min(Math.max(8, preferredLeft), Math.max(8, viewportWidth - width - 8));
         const estimatedHeight = Math.min(Math.max(options.length * 32, 40), 240);
         const spaceBelow = portalWin.innerHeight - rect.bottom - offsetY - 8;
         const spaceAbove = rect.top - offsetY - 8;
         const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
         const top = shouldOpenUpward
            ? Math.max(8, rect.top - estimatedHeight - offsetY)
            : rect.bottom + offsetY;

         setMenuPos({
            top,
            left: clampedLeft,
            width,
         });
         setOpenUpward(shouldOpenUpward);
      };

      updatePosition();
      portalWin.addEventListener("resize", updatePosition);
      portalWin.addEventListener("scroll", updatePosition, true);
      return () => {
         portalWin.removeEventListener("resize", updatePosition);
         portalWin.removeEventListener("scroll", updatePosition, true);
      };
   }, [open, align, menuWidth, offsetY, portalWin, options.length]);

   useEffect(() => {
      if (disabled) setOpen(false);
   }, [disabled]);

   return (
      <div ref={rootRef} className={`ex-tw-relative ${className}`.trim()}>
         <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            onClick={() => setOpen((prev) => !prev)}
            className={`${defaultButtonClass} ${buttonClassName} ${
               disabled ? "ex-tw-opacity-60 ex-tw-cursor-not-allowed" : ""
            }`.trim()}
         >
            {buttonLabel || selectedLabel || placeholder}
         </button>
         {open &&
            !disabled &&
            createPortal(
               <div
                  ref={menuRef}
                  className={`${defaultMenuClass} ${menuClassName}`.trim()}
                  style={{
                     position: "fixed",
                     top: menuPos.top,
                     left: menuPos.left,
                     width: menuPos.width,
                     maxHeight: 240,
                     overflowY: "auto",
                     zIndex: 2147483646,
                  }}
                  data-open-direction={openUpward ? "up" : "down"}
               >
                  {options.map((item) => (
                     <button
                        key={item.value}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => {
                           if (item.disabled) return;
                           onChange(item.value);
                           setOpen(false);
                        }}
                        className={`${defaultItemClass} ${itemClassName} ${
                           item.disabled ? "ex-tw-opacity-50 ex-tw-cursor-not-allowed" : ""
                        }`.trim()}
                     >
                        {item.label}
                     </button>
                  ))}
               </div>,
               portalDoc.body
            )}
      </div>
   );
}
