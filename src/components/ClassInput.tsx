import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Fuse from "fuse.js";
import twMeta from "../tw-meta.clean.json";
import ColorPickerPopover from "./ColorPickerPopover";
import CopyButton from "./CopyButton";
import DropdownSuggestion from "./DropdownSuggestion";

interface TWItem {
   name: string;
   color?: string;
}

interface ClassInputProps {
   type: "Active" | "Focus" | "Hover" | "Disabled";
   preview?: HTMLElement | null;
}

export default function ClassInput({ type, preview }: ClassInputProps) {
   const [tags, setTags] = useState<string[]>([]);
   const [input, setInput] = useState("");
   const [isComposing, setIsComposing] = useState(false);
   const [suggestions, setSuggestions] = useState<TWItem[]>([]);
   const [dropdownPos, setDropdownPos] = useState<{
      top: number;
      left: number;
      width: number;
   } | null>(null);
   const [highlightIndex, setHighlightIndex] = useState<number>(-1);

   // 🎨 컬러피커 상태
   const [colorPicker, setColorPicker] = useState({
      visible: false,
      position: { x: 0, y: 0 },
      prefix: "",
   });
   const [colorValue, setColorValue] = useState("#ffffff");

   const inputRef = useRef<HTMLInputElement>(null);
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

   /* ========== 유틸 ========== */
   const findScrollableParent = (el: HTMLElement | null): HTMLElement | Window => {
      let current: HTMLElement | null = el;
      while (current) {
         const overflowY = window.getComputedStyle(current).overflowY;
         if (overflowY === "auto" || overflowY === "scroll") return current;
         current = current.parentElement;
      }
      return window;
   };

   const updateDropdownPos = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
         top: rect.bottom + window.scrollY + 4,
         left: rect.left + window.scrollX,
         width: rect.width,
      });
   };

   const updateColorPickerPos = () => {
      if (!inputRef.current) return;
      const rect = inputRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      setColorPicker((prev) => ({
         ...prev,
         position: { x: rect.left + scrollX, y: rect.bottom + scrollY + 6 },
      }));
   };

   /* ========== 입력 / 자동완성 ========== */
   useEffect(() => {
      if (input.length < 2) {
         setSuggestions([]);
         setHighlightIndex(-1);
         return;
      }
      const results = fuse
         .search(input)
         .slice(0, 10)
         .map((r) => r.item);
      setSuggestions(results);
      setHighlightIndex(results.length > 0 ? 0 : -1);
   }, [input, fuse]);

   /* ========== 컬러피커팝업 감지 ========== */
   useEffect(() => {
      const match = input.match(
         /^(hover|active|focus|disabled)?\:?(bg|text|border)-\[#([0-9a-fA-F]{0,6})\]?$/
      );

      if (match && inputRef.current) {
         const [, variant, prefix] = match;

         // ✅ 먼저 rect 계산
         const rect = inputRef.current.getBoundingClientRect();
         const scrollY = window.scrollY || document.documentElement.scrollTop;
         const scrollX = window.scrollX || document.documentElement.scrollLeft;

         // ✅ 좌표를 미리 계산하고 나서 visible=true
         const newPos = {
            x: rect.left + scrollX,
            y: rect.bottom + scrollY + 6,
         };

         setColorPicker({
            visible: true,
            position: newPos,
            prefix: `${variant ? variant + ":" : ""}${prefix}`,
         });
      } else {
         // # 지우면 닫기
         setColorPicker((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
   }, [input]);

   /* ========== 스크롤 / 리사이즈 대응 (드롭다운 + 컬러피커 공통) ========== */
   useEffect(() => {
      const handle = () => {
         updateDropdownPos();
         if (colorPicker.visible) updateColorPickerPos();
      };

      const scrollParent = inputRef.current ? findScrollableParent(inputRef.current) : window;
      scrollParent.addEventListener("scroll", handle, { passive: true });
      window.addEventListener("scroll", handle, true);
      window.addEventListener("resize", handle);

      if ("ResizeObserver" in window) {
         roRef.current = new ResizeObserver(handle);
         if (inputRef.current) roRef.current.observe(inputRef.current);
      }

      return () => {
         scrollParent.removeEventListener("scroll", handle);
         window.removeEventListener("scroll", handle, true);
         window.removeEventListener("resize", handle);
         roRef.current?.disconnect();
      };
   }, [colorPicker.visible]);

   /* ========== 프리뷰에 클래스 적용 ========== */
   useEffect(() => {
      if (!preview) return;
      const original = preview.className.split(" ").filter(Boolean);
      const withoutPrefixed = original.filter(
         (cls) => !cls.startsWith(`${type.toLowerCase()}:ex-tw-tester-`)
      );
      const prefixed = tags.map((tag) => `${type.toLowerCase()}:ex-tw-tester-${tag}`);
      preview.className = [...new Set([...withoutPrefixed, ...prefixed])].join(" ");
   }, [tags, preview]);

   /* ========== 색상 적용 ========== */
   const applyColor = (color: string) => {
      if (!preview) return;

      const variant = type.toLowerCase(); // ex) hover
      const prefix = colorPicker.prefix; // ex) bg, text, border, ring

      // ✅ 변수 이름 매핑
      const varMap: Record<string, string> = {
         bg: `--tw-${variant}-bg-color`,
         text: `--tw-${variant}-text-color`,
         border: `--tw-${variant}-border-color`,
         ring: `--tw-${variant}-ring-color`, // ✅ 추가
      };

      const varName = varMap[prefix];
      if (!varName) return;

      // ✅ CSS 변수 세팅
      preview.style.setProperty(varName, color);

      // ✅ 가변값 스위치 클래스 부여
      const map: Record<string, string> = { bg: "bg", text: "text", border: "bc", ring: "ring" };
      const switchClass = `ex-ov-${variant}-${map[prefix]}`;
      if (!preview.classList.contains(switchClass)) {
         preview.classList.add(switchClass);
      }

      // ✅ 표시용 태그
      const className = `${prefix}-[${color}]`;
      setTags((prev) => [...prev, className]);
      setColorValue(color);
      setInput("");
      setColorPicker((p) => ({ ...p, visible: false }));
   };

   /* ========== 키 입력 처리 ========== */
   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // ✅ 입력값이 컬러 관련인지 체크
      const isColorPattern =
         /^(hover|active|focus|disabled)?\:?(bg|text|border|ring)-\[#?[0-9a-fA-F]*\]?$/i.test(
            input.trim()
         );

      // Ctrl+Space → 자동완성
      if ((e.ctrlKey || e.metaKey) && (e.key === " " || e.code === "Space")) {
         e.preventDefault();

         // 🩵 컬러 패턴이면 컬러피커 우선
         if (isColorPattern) {
            updateColorPickerPos();
            setColorPicker({
               visible: true,
               position: colorPicker.position,
               prefix: input.match(/(bg|text|border|ring)/)?.[1] || "bg",
            });
            return;
         }

         // 🔍 일반 자동완성
         const query = input.trim() || "";
         const results = fuse
            .search(query)
            .slice(0, 10)
            .map((r) => r.item);
         setSuggestions(results);
         setHighlightIndex(results.length > 0 ? 0 : -1);
         updateDropdownPos();
         return;
      }

      // Ctrl+Enter → 컬러피커 강제 열기 (명시적 호출)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
         e.preventDefault();

         // ✅ 패턴 기반 prefix 자동 감지
         const match = input.match(/(bg|text|border|ring)/);
         const prefix = match ? match[1] : "bg";

         updateColorPickerPos();
         setColorPicker({
            visible: true,
            position: colorPicker.position,
            prefix,
         });
         return;
      }
      // ESC → 드롭다운/컬러피커 닫기
      if (e.key === "Escape") {
         e.preventDefault();
         setSuggestions([]);
         setColorPicker((prev) => (prev.visible ? { ...prev, visible: false } : prev));
         return;
      }

      if (isComposing) return;

      // 방향키 / Enter / Backspace 처리
      if (e.code === "ArrowDown") {
         e.preventDefault();
         setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.code === "ArrowUp") {
         e.preventDefault();
         setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.code === "Enter") {
         e.preventDefault();
         if (highlightIndex >= 0 && suggestions[highlightIndex])
            addTag(suggestions[highlightIndex].name);
         else if (input.trim()) addTag(input);
      } else if (e.code === "Backspace" && !input && tags.length) {
         e.preventDefault();
         setTags((prev) => prev.slice(0, -1));
      }
   };

   const addTag = (val: string) => {
      const v = val.trim();
      if (!v || tags.includes(v)) return;
      setTags((prev) => [...prev, v]);
      setInput("");
      setSuggestions([]);
   };
   const removeTag = (tag: string) => {
      setTags((prev) => prev.filter((t) => t !== tag));

      if (!preview) return;

      // 🎯 variant/prefix 추출 (예: "active:bg-[#1c3051]" → variant=active, prefix=bg)
      const match = tag.match(/^(hover|active|focus|disabled)?\:?(bg|text|border)-/);
      if (!match) return;
      const variant = match[1]?.toLowerCase() || type.toLowerCase();
      const prefix = match[2];

      // 🎯 CSS 변수 제거
      const varName = `--tw-${variant}-${prefix}-color`;
      preview.style.removeProperty(varName);

      // 🎯 스위치 클래스 제거
      const map: Record<string, string> = { bg: "bg", text: "text", border: "bc" };
      const switchClass = `ex-ov-${variant}-${map[prefix]}`;
      preview.classList.remove(switchClass);
   };

   const dropdown =
      dropdownPos && suggestions.length > 0 && inputRef.current
         ? ReactDOM.createPortal(
              <DropdownSuggestion
                 position={dropdownPos}
                 suggestions={suggestions}
                 highlightIndex={highlightIndex}
                 onSelect={(name) => addTag(name)}
              />,
              inputRef.current.ownerDocument.body
           )
         : null;
   /* ========== ColorPickerPopover ========== */
   const colorPickerPortal =
      colorPicker.visible &&
      ReactDOM.createPortal(
         <ColorPickerPopover
            initialColor={colorValue}
            position={colorPicker.position}
            onSelect={applyColor}
            onClose={() => setColorPicker({ ...colorPicker, visible: false })}
         />,
         inputRef.current?.ownerDocument?.body ?? document.body
      );

   return (
      <>
         <div className="ex-tw-relative">
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
                  placeholder={tags.length ? "" : `${type} 클래스 입력`}
                  className="ex-tw-flex-1 ex-tw-min-w-[120px] ex-tw-border-none ex-tw-bg-transparent ex-tw-text-text1 ex-tw-text-base focus:ex-tw-outline-none"
               />
               {tags.length > 0 && (
                  <CopyButton
                     useIcon={false}
                     textToCopy={tags.map((tag) => `${type.toLowerCase()}:${tag}`).join(" ")}
                     className="ex-tw-w-20 ex-tw-h-[28px] !ex-tw-text-sm"
                  />
               )}
            </div>
         </div>
         {dropdown}
         {colorPickerPortal}
      </>
   );
}
