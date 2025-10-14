import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Fuse from "fuse.js";
import twMeta from "../tw-meta.json";

interface TWItem {
   name: string;
   color?: string;
}

interface ClassInputProps {
   placeholder?: string;
   target?: HTMLElement | null;
}

export default function ClassInput({ placeholder = "클래스 입력...", target }: ClassInputProps) {
   const [tags, setTags] = useState<string[]>([]);
   const [input, setInput] = useState("");
   const [isComposing, setIsComposing] = useState(false);
   const [suggestions, setSuggestions] = useState<TWItem[]>([]);
   const [dropdownPos, setDropdownPos] = useState<{
      top: number;
      left: number;
      width: number;
   } | null>(null);

   const inputRef = useRef<HTMLInputElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const roRef = useRef<ResizeObserver | null>(null);

   /* ========== Fuse 검색 엔진 ========== */
   const fuse = useMemo(
      () =>
         new Fuse(twMeta as TWItem[], {
            keys: ["name"],
            threshold: 0.3,
            minMatchCharLength: 2,
         }),
      []
   );

   /* ========== 입력 시 자동완성 ========== */
   useEffect(() => {
      if (input.length < 2) return setSuggestions([]);
      const results = fuse
         .search(input)
         .slice(0, 10)
         .map((r) => r.item);
      setSuggestions(results);
   }, [input, fuse]);

   /* ========== 드롭다운 위치 계산 (iframe 내부 좌표 기준) ========== */
   const updateDropdownPos = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
         top: rect.bottom + window.scrollY + 4,
         left: rect.left + window.scrollX,
         width: rect.width,
      });
   };

   useLayoutEffect(() => {
      if (suggestions.length > 0) updateDropdownPos();
   }, [suggestions.length]);

   useEffect(() => {
      const handle = () => updateDropdownPos();
      window.addEventListener("scroll", handle, true);
      window.addEventListener("resize", handle);

      if ("ResizeObserver" in window) {
         roRef.current = new ResizeObserver(handle);
         if (inputRef.current) roRef.current.observe(inputRef.current);
      }

      return () => {
         window.removeEventListener("scroll", handle, true);
         window.removeEventListener("resize", handle);
         roRef.current?.disconnect();
      };
   }, []);

   /* ========== 태그 추가 / 제거 ========== */
   const addTag = (val: string) => {
      const v = val.trim();
      if (!v || tags.includes(v)) return;
      setTags((prev) => [...prev, v]);
      setInput("");
      setSuggestions([]);
   };
   const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

   /* ========== 타겟 엘리먼트에 클래스 적용 ========== */
   useEffect(() => {
      if (!target) return;
      target.className = tags.join(" ");
   }, [tags, target]);

   /* ========== 키 입력 처리 ========== */
   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposing) return;
      if (["Enter", "Comma", " "].includes(e.code)) {
         e.preventDefault();
         if (suggestions.length && input) addTag(suggestions[0].name);
         else addTag(input);
      }
      if (e.code === "Backspace" && !input && tags.length) {
         setTags((prev) => prev.slice(0, -1));
      }
   };

   const dropdown =
      dropdownPos && suggestions.length > 0 && inputRef.current
         ? ReactDOM.createPortal(
              <div
                 // ✅ 추가된 부분
                 onMouseDown={(e) => {
                    e.stopPropagation(); // 상위로 이벤트 전달 막기
                 }}
                 onClick={(e) => {
                    e.stopPropagation();
                 }}
                 className="ex-tw-fixed ex-tw-bg-white ex-tw-border ex-tw-border-gray-200
                     ex-tw-rounded-md ex-tw-shadow-lg ex-tw-z-[2147483646]
                     ex-tw-max-h-72 ex-tw-overflow-auto ex-tw-dropdown"
                 style={{
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                 }}
              >
                 {suggestions.map((item) => (
                    <button
                       key={item.name}
                       onClick={(e) => {
                          e.stopPropagation(); // 버튼 클릭 시도 전파 방지
                          addTag(item.name);
                       }}
                       className="ex-tw-flex ex-tw-items-center ex-tw-gap-2 ex-tw-w-full
                         ex-tw-text-left ex-tw-px-3 ex-tw-py-2 hover:ex-tw-bg-gray-100 ex-tw-transition"
                    >
                       {item.name.startsWith("bg-") && (
                          <span
                             className="ex-tw-w-3 ex-tw-h-3 ex-tw-rounded-full ex-tw-border ex-tw-border-gray-300"
                             style={{ backgroundColor: extractColor(item.name) }}
                          />
                       )}
                       <span className="ex-tw-text-sm ex-tw-text-gray-800">{item.name}</span>
                    </button>
                 ))}
              </div>,
              inputRef.current.ownerDocument.body
           )
         : null;

   return (
      <>
         <div ref={containerRef} className="ex-tw-relative">
            <div className="ex-tw-flex ex-tw-flex-wrap ex-tw-gap-2 ex-tw-items-center ex-tw-border-b ex-tw-border-border1 ex-tw-pb-2 ex-tw-min-h-[48px] focus-within:ex-tw-border-text5">
               {tags.map((tag) => (
                  <div
                     key={tag}
                     className="ex-tw-flex ex-tw-items-center ex-tw-gap-1 ex-tw-bg-gray-100 ex-tw-text-gray-700 ex-tw-px-2 ex-tw-py-1 ex-tw-rounded-md ex-tw-text-sm hover:ex-tw-bg-gray-200"
                  >
                     <span>{tag}</span>
                     <button
                        onClick={() => removeTag(tag)}
                        className="ex-tw-text-gray-400 hover:ex-tw-text-red-500"
                     >
                        ✕
                     </button>
                  </div>
               ))}

               <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                     setIsComposing(false);
                     setInput(e.currentTarget.value);
                  }}
                  placeholder={tags.length ? "" : placeholder}
                  className="ex-tw-flex-1 ex-tw-min-w-[120px] ex-tw-border-none ex-tw-bg-transparent ex-tw-text-text1 ex-tw-text-base focus:ex-tw-outline-none"
               />
            </div>
         </div>

         {dropdown}
      </>
   );
}

/* 색상 추출 */
function extractColor(className: string): string {
   const parts = className.split("-");
   if (parts.length < 3) return "";
   const color = parts[1];
   const shade = parts[2];
   const map: Record<string, string> = {
      red: `hsl(0, 80%, ${100 - Number(shade) / 10}%)`,
      blue: `hsl(220, 80%, ${100 - Number(shade) / 10}%)`,
      green: `hsl(140, 60%, ${100 - Number(shade) / 10}%)`,
      gray: `hsl(0, 0%, ${100 - Number(shade) / 10}%)`,
   };
   return map[color] || "";
}
