import { useEffect, useMemo, useRef, useState } from "react";
import ClassInput from "../../components/ClassInput";
import DropdownMenu from "../../components/DropdownMenu";
import { CheckIcon } from "@heroicons/react/24/outline";
import { cssToTailwind } from "../../hooks/useConverter";
import { cleanClassTokens } from "../../hooks/classCleaner";

const evtList = ["Active", "Hover", "Disabled", "Focus"] as const;
type VariantType = (typeof evtList)[number];
type VariantTagMap = Record<VariantType, string[]>;
type TesterPreset = {
   id: string;
   name: string;
   tags: VariantTagMap;
   isDisabled: boolean;
   createdAt: number;
};
type BreadcrumbItem =
   | { kind: "node"; element: HTMLElement; index: number }
   | { kind: "ellipsis"; key: string };
const PRESET_STORAGE_KEY = "testerPresets";
type PresetSortType = "latest" | "name";
type ImportedPresetCandidate = {
   id?: string;
   name?: string;
   tags?: Partial<Record<VariantType, unknown>>;
   isDisabled?: boolean;
   createdAt?: number;
};
const presetSortOptions: { value: PresetSortType; label: string }[] = [
   { value: "latest", label: "최신순" },
   { value: "name", label: "이름순" },
];

const makeEmptyTagMap = (): VariantTagMap => ({
   Active: [],
   Hover: [],
   Disabled: [],
   Focus: [],
});
const makeFullApplyScope = (): Record<VariantType, boolean> => ({
   Active: true,
   Hover: true,
   Disabled: true,
   Focus: true,
});

const cleanTagMap = (source: VariantTagMap): VariantTagMap => ({
   Active: cleanClassTokens(source.Active),
   Hover: cleanClassTokens(source.Hover),
   Disabled: cleanClassTokens(source.Disabled),
   Focus: cleanClassTokens(source.Focus),
});

const variantMap: Record<string, VariantType> = {
   active: "Active",
   hover: "Hover",
   disabled: "Disabled",
   focus: "Focus",
};

const extractStateTagsFromElement = (el: HTMLElement): VariantTagMap => {
   const result = makeEmptyTagMap();
   const dedup = {
      Active: new Set<string>(),
      Hover: new Set<string>(),
      Disabled: new Set<string>(),
      Focus: new Set<string>(),
   } as const;

   for (const cls of Array.from(el.classList)) {
      if (!cls.includes(":")) continue;
      const parts = cls.split(":");
      if (parts.length < 2) continue;

      const utility = parts[parts.length - 1];
      if (!utility || utility.startsWith("ex-tw-")) continue;

      for (const part of parts.slice(0, -1)) {
         const key = variantMap[part];
         if (!key) continue;
         dedup[key].add(utility);
      }
   }

   result.Active = Array.from(dedup.Active);
   result.Hover = Array.from(dedup.Hover);
   result.Disabled = Array.from(dedup.Disabled);
   result.Focus = Array.from(dedup.Focus);
  return result;
};

const mergeTagMaps = (lhs: VariantTagMap, rhs: VariantTagMap): VariantTagMap => {
   const dedupe = (a: string[], b: string[]) => Array.from(new Set([...a, ...b]));
   return {
      Active: dedupe(lhs.Active, rhs.Active),
      Hover: dedupe(lhs.Hover, rhs.Hover),
      Disabled: dedupe(lhs.Disabled, rhs.Disabled),
      Focus: dedupe(lhs.Focus, rhs.Focus),
   };
};

const splitClasses = (classText: string): string[] => {
   if (!classText.trim()) return [];
   return classText.split(/\s+/).filter(Boolean);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
   typeof value === "object" && value !== null;

const selectorToVariant = (selector: string): VariantType[] => {
   const found: VariantType[] = [];
   if (/:hover\b/.test(selector)) found.push("Hover");
   if (/:active\b/.test(selector)) found.push("Active");
   if (/:focus\b/.test(selector) || /:focus-visible\b/.test(selector)) found.push("Focus");
   if (/:disabled\b/.test(selector)) found.push("Disabled");
   return found;
};

const stripStatePseudos = (selector: string): string => {
   return selector
      .replace(/::[a-zA-Z-]+/g, "") // pseudo-element 제거
      .replace(/:hover\b/g, "")
      .replace(/:active\b/g, "")
      .replace(/:focus-visible\b/g, "")
      .replace(/:focus-within\b/g, "")
      .replace(/:focus\b/g, "")
      .replace(/:disabled\b/g, "")
      .replace(/:where\(\s*\)/g, "")
      .replace(/:is\(\s*\)/g, "")
      .replace(/:not\(\s*\)/g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([>+~])\s*/g, " $1 ")
      .trim();
};

const extractStateTagsFromCssRules = (el: HTMLElement): VariantTagMap => {
   const styleMap: Record<VariantType, Record<string, string>> = {
      Active: {},
      Hover: {},
      Disabled: {},
      Focus: {},
   };

   const readRules = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
         if (rule instanceof CSSStyleRule) {
            const selectors = rule.selectorText.split(",").map((s) => s.trim());
            for (const selector of selectors) {
               const variants = selectorToVariant(selector);
               if (!variants.length) continue;

               const baseSelector = stripStatePseudos(selector).trim();
               if (!baseSelector) continue;
               if (/[>+~]\s*$/.test(baseSelector)) continue;

               let matched = false;
               try {
                  matched = el.matches(baseSelector);
               } catch {
                  matched = false;
               }
               if (!matched) continue;

               for (const variant of variants) {
                  for (const prop of Array.from(rule.style)) {
                     const value = rule.style.getPropertyValue(prop);
                     if (!value) continue;
                     styleMap[variant][prop] = value.trim();
                  }
               }
            }
         } else if (rule instanceof CSSMediaRule) {
            if (window.matchMedia(rule.conditionText).matches) {
               readRules(rule.cssRules);
            }
         } else if (rule instanceof CSSSupportsRule) {
            readRules(rule.cssRules);
         } else if ("cssRules" in rule) {
            // CSSLayerBlockRule 등 그룹 룰 처리
            try {
               const nested = (rule as CSSGroupingRule).cssRules;
               if (nested) readRules(nested);
            } catch {
               // ignore
            }
         }
      }
   };

   for (const sheet of Array.from(document.styleSheets)) {
      try {
         if (!sheet.cssRules) continue;
         readRules(sheet.cssRules);
      } catch {
         // cross-origin stylesheet 접근 제한 무시
      }
   }

   const toTags = (variant: VariantType) => splitClasses(cssToTailwind(styleMap[variant]));
   return {
      Active: toTags("Active"),
      Hover: toTags("Hover"),
      Disabled: toTags("Disabled"),
      Focus: toTags("Focus"),
   };
};

export default function TesterPopover({
   target,
   iframeDoc,
   onTargetChange,
}: {
   target: HTMLElement;
   iframeDoc: Document;
   onTargetChange?: (el: HTMLElement) => void;
}) {
   const previewRef = useRef<HTMLDivElement>(null);
   const popoverRef = useRef<HTMLDivElement>(null);
   const bodyScrollRef = useRef<HTMLDivElement>(null);
   const importInputRef = useRef<HTMLInputElement>(null);
   const [previewClone, setPreviewClone] = useState<HTMLElement | null>(null);
   const [isDisabled, setIsDisabled] = useState(false);
   const [baseTarget, setBaseTarget] = useState<HTMLElement>(target);
   const [selectedTarget, setSelectedTarget] = useState<HTMLElement>(target);
   const [inputResetKey, setInputResetKey] = useState(0);
   const [tagSnapshot, setTagSnapshot] = useState<VariantTagMap>(makeEmptyTagMap());
   const [seedTags, setSeedTags] = useState<VariantTagMap>(makeEmptyTagMap());
   const [applyScope, setApplyScope] = useState<Record<VariantType, boolean>>(makeFullApplyScope());
   const [presets, setPresets] = useState<TesterPreset[]>([]);
   const [presetName, setPresetName] = useState("");
   const [selectedPresetId, setSelectedPresetId] = useState("");
   const [presetSort, setPresetSort] = useState<PresetSortType>("latest");
   const [feedbackAction, setFeedbackAction] = useState<
      "" | "save" | "update" | "delete" | "import"
   >("");
   const [presetError, setPresetError] = useState("");

   useEffect(() => {
      chrome.storage.local.get([PRESET_STORAGE_KEY], (res) => {
         const saved = res[PRESET_STORAGE_KEY];
         if (!Array.isArray(saved)) return;
         setPresets(saved as TesterPreset[]);
      });
   }, []);

   const persistPresets = (next: TesterPreset[]) => {
      setPresets(next);
      chrome.storage.local.set({ [PRESET_STORAGE_KEY]: next });
   };

   const normalizePresetName = (name: string) => name.trim().toLocaleLowerCase();
   const hasDuplicatePresetName = (name: string, excludeId?: string) => {
      const target = normalizePresetName(name);
      return presets.some(
         (preset) =>
            preset.id !== excludeId && normalizePresetName(preset.name) === target
      );
   };

   const sortedPresets = useMemo(() => {
      const copied = [...presets];
      if (presetSort === "name") {
         copied.sort((a, b) => a.name.localeCompare(b.name, "ko"));
      } else {
         copied.sort((a, b) => b.createdAt - a.createdAt);
      }
      return copied;
   }, [presets, presetSort]);
   const presetSelectOptions = useMemo(
      () => sortedPresets.map((preset) => ({ value: preset.id, label: preset.name })),
      [sortedPresets]
   );
   const presetDropdownOptions = useMemo(
      () =>
         presetSelectOptions.length > 0
            ? [{ value: "", label: "None" }, ...presetSelectOptions]
            : [
                 { value: "", label: "None" },
                 { value: "__empty__", label: "불러올 프리셋 없음", disabled: true },
              ],
      [presetSelectOptions]
   );
   const hasPresets = presetSelectOptions.length > 0;

   const clearPreviewVariantState = () => {
      if (!previewClone) return;
      previewClone.className = previewClone.className
         .split(" ")
         .filter((cls) => cls && !/:ex-tw-tester-/.test(cls) && !cls.startsWith("ex-ov-"))
         .join(" ");
      for (const prop of Array.from(previewClone.style)) {
         if (prop.startsWith("--tw-") && prop.endsWith("-color")) {
            previewClone.style.removeProperty(prop);
         }
      }
   };

   useEffect(() => {
      const extracted = mergeTagMaps(
         extractStateTagsFromElement(target),
         extractStateTagsFromCssRules(target)
      );
      setBaseTarget(target);
      setSelectedTarget(target);
      setIsDisabled(target.hasAttribute("disabled"));
      setTagSnapshot(extracted);
      setSeedTags(extracted);
      setSelectedPresetId("");
      setInputResetKey((prev) => prev + 1);
   }, [target]);

   const trimMiddle = (value: string, max = 22) => {
      if (value.length <= max) return value;
      const head = Math.ceil((max - 3) / 2);
      const tail = Math.floor((max - 3) / 2);
      return `${value.slice(0, head)}...${value.slice(-tail)}`;
   };

   const makeTargetLabel = (el: HTMLElement) => {
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const classes = Array.from(el.classList).slice(0, 1).join(".");
      const raw = classes ? `${tag}.${classes}${id}` : `${tag}${id}`;
      return trimMiddle(raw);
   };

   const ancestorChain = useMemo(() => {
      if (!baseTarget || !baseTarget.isConnected) return [];

      const chain: HTMLElement[] = [];
      let current: HTMLElement | null = baseTarget;
      while (current && chain.length < 12) {
         chain.push(current);
         if (current === document.body || current === document.documentElement) break;
         current = current.parentElement;
      }
      return chain;
   }, [baseTarget]);

   const breadcrumbItems = useMemo(() => {
      const maxNodes = 6;
      const nodes: BreadcrumbItem[] = ancestorChain.map((el, idx) => ({
         kind: "node",
         element: el,
         index: idx,
      }));
      if (nodes.length <= maxNodes) return nodes;
      return [nodes[0], nodes[1], { kind: "ellipsis", key: "middle" }, ...nodes.slice(-3)];
   }, [ancestorChain]);

   const handleTargetSelect = (el: HTMLElement) => {
      const extracted = mergeTagMaps(extractStateTagsFromElement(el), extractStateTagsFromCssRules(el));
      setSelectedTarget(el);
      setIsDisabled(el.hasAttribute("disabled"));
      setTagSnapshot(extracted);
      setSeedTags(extracted);
      setSelectedPresetId("");
      setInputResetKey((prev) => prev + 1);
      onTargetChange?.(el);
   };

   const applyPreset = (presetId: string) => {
      setSelectedPresetId(presetId);
      if (!presetId) {
         setPresetName("");
         return;
      }
      const preset = presets.find((item) => item.id === presetId);
      if (!preset) return;

      clearPreviewVariantState();
      const nextSeedTags: VariantTagMap = {
         Active: applyScope.Active ? [...preset.tags.Active] : [...seedTags.Active],
         Hover: applyScope.Hover ? [...preset.tags.Hover] : [...seedTags.Hover],
         Disabled: applyScope.Disabled ? [...preset.tags.Disabled] : [...seedTags.Disabled],
         Focus: applyScope.Focus ? [...preset.tags.Focus] : [...seedTags.Focus],
      };
      const nextSnapshot: VariantTagMap = {
         Active: applyScope.Active ? [...preset.tags.Active] : [...tagSnapshot.Active],
         Hover: applyScope.Hover ? [...preset.tags.Hover] : [...tagSnapshot.Hover],
         Disabled: applyScope.Disabled ? [...preset.tags.Disabled] : [...tagSnapshot.Disabled],
         Focus: applyScope.Focus ? [...preset.tags.Focus] : [...tagSnapshot.Focus],
      };
      setSeedTags(nextSeedTags);
      setTagSnapshot(nextSnapshot);
      if (applyScope.Disabled) {
         setIsDisabled(!!preset.isDisabled);
      }
      setPresetName(preset.name);
      setInputResetKey((prev) => prev + 1);
   };

   const savePreset = () => {
      const name = presetName.trim();
      if (!name) {
         setPresetError("프리셋 이름을 입력해주세요.");
         return;
      }
      if (hasDuplicatePresetName(name)) {
         setPresetError("같은 이름의 프리셋이 이미 있습니다.");
         return;
      }
      setPresetError("");

      const id =
         typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `preset-${Date.now()}`;
      const newPreset: TesterPreset = {
         id,
         name,
         tags: cleanTagMap(tagSnapshot),
         isDisabled,
         createdAt: Date.now(),
      };

      const next = [newPreset, ...presets].slice(0, 30);
      persistPresets(next);
      setSelectedPresetId(id);
      setPresetName(name);
      setFeedbackAction("save");
   };

   const deletePreset = () => {
      if (!selectedPresetId) return;
      const next = presets.filter((item) => item.id !== selectedPresetId);
      persistPresets(next);
      setSelectedPresetId("");
      setFeedbackAction("delete");
   };

   const exportPresets = () => {
      const payload = {
         version: 1,
         exportedAt: new Date().toISOString(),
         presets,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
         type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tester-presets-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
   };

   const normalizeImportedPreset = (item: unknown): TesterPreset | null => {
      if (!isRecord(item)) return null;
      const candidate = item as ImportedPresetCandidate;
      if (typeof candidate.name !== "string") return null;

      const tags = isRecord(candidate.tags) ? candidate.tags : {};
      const normalized: TesterPreset = {
         id:
            typeof candidate.id === "string" && candidate.id
               ? candidate.id
               : typeof crypto !== "undefined" && "randomUUID" in crypto
                 ? crypto.randomUUID()
                 : `preset-${Date.now()}`,
         name: candidate.name.trim(),
         tags: cleanTagMap({
            Active: Array.isArray(tags.Active)
               ? tags.Active.filter((v): v is string => typeof v === "string")
               : [],
            Hover: Array.isArray(tags.Hover)
               ? tags.Hover.filter((v): v is string => typeof v === "string")
               : [],
            Disabled: Array.isArray(tags.Disabled)
               ? tags.Disabled.filter((v): v is string => typeof v === "string")
               : [],
            Focus: Array.isArray(tags.Focus)
               ? tags.Focus.filter((v): v is string => typeof v === "string")
               : [],
         }),
         isDisabled: !!candidate.isDisabled,
         createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : Date.now(),
      };
      if (!normalized.name) return null;
      return normalized;
   };

   const openImportPicker = () => {
      const input = importInputRef.current;
      if (!input) return;
      try {
         if (typeof input.showPicker === "function") {
            input.showPicker();
            return;
         }
      } catch {
         // fallback to click
      }
      input.click();
   };

   const handleImportFile = async (file: File) => {
      try {
         const text = await file.text();
         const parsed: unknown = JSON.parse(text.replace(/^\uFEFF/, ""));
         const list = Array.isArray(parsed)
            ? parsed
            : isRecord(parsed) && Array.isArray(parsed.presets)
              ? parsed.presets
              : null;
         if (!Array.isArray(list)) {
            setPresetError("가져오기 파일 형식이 올바르지 않습니다.");
            return;
         }

         const imported = list.map(normalizeImportedPreset).filter(Boolean) as TesterPreset[];
         if (!imported.length) {
            setPresetError("가져올 프리셋이 없습니다.");
            return;
         }

         const byName = new Map<string, TesterPreset>();
         for (const item of presets) byName.set(normalizePresetName(item.name), item);
         for (const item of imported) {
            let name = item.name;
            let key = normalizePresetName(name);
            let suffix = 1;
            while (byName.has(key)) {
               name = `${item.name} (${suffix++})`;
               key = normalizePresetName(name);
            }
            byName.set(key, { ...item, name });
         }

         const merged = Array.from(byName.values())
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);
         persistPresets(merged);
         setPresetError("");
         setFeedbackAction("import");
      } catch {
         setPresetError("파일 파싱에 실패했습니다.");
      }
   };

   const updatePreset = () => {
      if (!selectedPresetId) return;
      const name = presetName.trim();
      if (!name) {
         setPresetError("프리셋 이름을 입력해주세요.");
         return;
      }
      if (hasDuplicatePresetName(name, selectedPresetId)) {
         setPresetError("같은 이름의 다른 프리셋이 이미 있습니다.");
         return;
      }
      setPresetError("");

      const next = presets.map((item) =>
         item.id === selectedPresetId
            ? {
                 ...item,
                 name,
                 tags: cleanTagMap(tagSnapshot),
                 isDisabled,
                 createdAt: Date.now(),
              }
            : item
      );
      persistPresets(next);
      setFeedbackAction("update");
   };

   useEffect(() => {
      if (!feedbackAction) return;
      const timer = window.setTimeout(() => setFeedbackAction(""), 1200);
      return () => window.clearTimeout(timer);
   }, [feedbackAction]);

   useEffect(() => {
      if (!presetError) return;
      const timer = window.setTimeout(() => setPresetError(""), 1800);
      return () => window.clearTimeout(timer);
   }, [presetError]);

   /* ========== Tailwind + Override 스타일 주입 ========== */
   useEffect(() => {
      const styleId = "ex-tw-tester";
      if (!iframeDoc.getElementById(styleId)) {
         const style = iframeDoc.createElement("link");
         style.id = "ex-tw-tester";
         style.rel = "stylesheet";
         style.href = chrome.runtime.getURL("assets/tw-meta.built.css");
         style.onload = () => console.log("✅ tw-meta.built.css 로드 완료");
         iframeDoc.head.appendChild(style);
      }
      // ✅ variant 시뮬레이션용 스타일 블록 추가
      const previewStyleId = "ex-tw-preview-variants";
      if (!iframeDoc.getElementById(previewStyleId)) {
         const variantStyle = iframeDoc.createElement("style");
         variantStyle.id = previewStyleId;
         variantStyle.textContent = `
/* ============================
   1) Fallback (Tailwind 변형 클래스가 없을 때만)
   ============================ */
.ex-tw-preview:hover:not([class*="hover:"]) {
  background-color: var(--tw-hover-bg-color);
  color:            var(--tw-hover-text-color);
  border-color:     var(--tw-hover-border-color);
}
.ex-tw-preview:active:not([class*="active:"]) {
  background-color: var(--tw-active-bg-color);
  color:            var(--tw-active-text-color);
  border-color:     var(--tw-active-border-color);
}
.ex-tw-preview:focus:not([class*="focus:"]) {
  background-color: var(--tw-focus-bg-color);
  color:            var(--tw-focus-text-color);
  border-color:     var(--tw-focus-border-color);
  outline: 2px solid var(--tw-focus-outline-color, transparent);
  outline-offset: 2px;
}
.ex-tw-preview:disabled:not([class*="disabled:"]) {
  background-color: var(--tw-disabled-bg-color);
  color:            var(--tw-disabled-text-color);
  border-color:     var(--tw-disabled-border-color);
}

/* ============================
   2) Override (가변값이 설정된 경우)
   - Tailwind 클래스보다 강하게 적용 (단, 동일 상태에 한함)
   ============================ */
.ex-tw-preview.ex-ov-hover-bg:hover {
  background-color: var(--tw-hover-bg-color) !important;
}
.ex-tw-preview.ex-ov-hover-text:hover {
  color: var(--tw-hover-text-color) !important;
}
.ex-tw-preview.ex-ov-hover-bc:hover {
  border-color: var(--tw-hover-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-active-bg:active {
  background-color: var(--tw-active-bg-color) !important;
}
.ex-tw-preview.ex-ov-active-text:active {
  color: var(--tw-active-text-color) !important;
}
.ex-tw-preview.ex-ov-active-bc:active {
  border-color: var(--tw-active-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-focus-bg:focus {
  background-color: var(--tw-focus-bg-color) !important;
}
.ex-tw-preview.ex-ov-focus-text:focus {
  color: var(--tw-focus-text-color) !important;
}
.ex-tw-preview.ex-ov-focus-bc:focus {
  border-color: var(--tw-focus-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-disabled-bg:disabled {
  background-color: var(--tw-disabled-bg-color) !important;
}
.ex-tw-preview.ex-ov-disabled-text:disabled {
  color: var(--tw-disabled-text-color) !important;
}
.ex-tw-preview.ex-ov-disabled-bc:disabled {
  border-color: var(--tw-disabled-border-color) !important;
  border-style: solid;
  border-width: var(--ex-border-width, 1px);
}

.ex-tw-preview.ex-ov-hover-ring:hover {
  --tw-ring-color: var(--tw-hover-ring-color) !important;
}
.ex-tw-preview.ex-ov-active-ring:active {
  --tw-ring-color: var(--tw-active-ring-color) !important;
}
.ex-tw-preview.ex-ov-focus-ring:focus {
  --tw-ring-color: var(--tw-focus-ring-color) !important;
}
.ex-tw-preview.ex-ov-disabled-ring:disabled {
  --tw-ring-color: var(--tw-disabled-ring-color) !important;
}
`;

         iframeDoc.head.appendChild(variantStyle);
      }
      //border 가 none으로 고정되어있어서 일단 강제로 스타일 생성
      const fixBorder = iframeDoc.createElement("style");
      fixBorder.textContent = `
  *, ::before, ::after {
    border-style: solid !important;
  }
`;
      iframeDoc.head.appendChild(fixBorder);

      const overrideId = "ex-tw-color-override";
      if (!iframeDoc.getElementById(overrideId)) {
         const s = iframeDoc.createElement("style");
         s.id = overrideId;
         s.textContent = `
            .ex-tw-color-scope * { color: inherit !important; }
            .ex-tw-color-scope button,
            .ex-tw-color-scope input,
            .ex-tw-color-scope select,
            .ex-tw-color-scope textarea { color: inherit !important; }
            .ex-tw-color-scope, .ex-tw-color-scope * {
               -webkit-text-fill-color: currentColor !important;
               -webkit-text-stroke-color: currentColor !important;
            }
         `;
         iframeDoc.head.appendChild(s);
      }
   }, [iframeDoc]);

   /* ========== 타겟 복제 및 스타일 복사 ========== */
   useEffect(() => {
      if (!selectedTarget || !previewRef.current) return;
      previewRef.current.innerHTML = "";

      const clone = selectedTarget.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.style.pointerEvents = "auto";
      clone.style.margin = "0";
      clone.style.display = "block";
      clone.style.position = "relative";
      clone.classList.add("ex-tw-color-scope", "ex-tw-preview");

      const computed = window.getComputedStyle(selectedTarget);
      const SKIP = new Set([
         "-webkit-text-fill-color",
         "-webkit-text-stroke-color",
         "-webkit-text-stroke-width",
      ]);
      for (const prop of computed) {
         if (SKIP.has(prop)) continue;
         try {
            clone.style.setProperty(prop, computed.getPropertyValue(prop));
         } catch {
            console.error("setproperty error");
         }
      }

      clone.style.setProperty("-webkit-text-fill-color", "currentColor");
      clone.style.setProperty("-webkit-text-stroke-color", "currentColor");

      previewRef.current.appendChild(clone);
      setPreviewClone(clone);

      // 스케일 맞추기
      const container = previewRef.current;
      const rect = selectedTarget.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scaleX = containerRect.width / rect.width;
      const scaleY = containerRect.height / rect.height;
      const scale = Math.min(scaleX, scaleY, 1);
      clone.style.transformOrigin = "top left";
      clone.style.transform = `scale(${scale})`;
      clone.removeAttribute("href");
   }, [selectedTarget]);

   /* ========== Disable 속성 토글 ========== */
   useEffect(() => {
      if (!previewClone) return;
      if (isDisabled) {
         previewClone.setAttribute("disabled", "true");
      } else {
         previewClone.removeAttribute("disabled");
      }
   }, [isDisabled, previewClone]);

   /* ========== UI ========== */
   return (
      <div
         ref={popoverRef}
         onMouseDown={() => {
            if (iframeDoc.getElementById("meta-dropdown"))
               document.dispatchEvent(new CustomEvent("close-all-dropdowns"));
         }}
         className="ex-tw-absolute ex-tw-rounded-md ex-tw-w-full ex-tw-h-full ex-tw-font-inter 
              ex-tw-border-border1 ex-tw-border-2 ex-tw-overflow-visible 
              ex-tw-bg-background1 ex-tw-shadow-lg
              ex-tw-transition-transform ex-tw-duration-150"
         style={{ zIndex: 9999 }}
      >
         <div className="ex-tw-h-full ex-tw-rounded-[inherit] ex-tw-overflow-hidden ex-tw-flex ex-tw-flex-col">
            <div
               id="tw-drag-handle"
               className="ex-tw-w-full ex-tw-relative ex-tw-border-border1 ex-tw-border-b-2 ex-tw-py-4 ex-tw-pl-4 ex-tw-select-none ex-tw-shrink-0"
            >
               <h2 className="ex-tw-text-xl ex-tw-font-bold ex-tw-text-text5">Tailwind UI Tester</h2>
               <div className="ex-tw-mt-1 ex-tw-flex ex-tw-flex-wrap ex-tw-items-center ex-tw-gap-1 ex-tw-text-xs ex-tw-text-text3 ex-tw-pr-4">
                  {breadcrumbItems.map((item, idx) => (
                     <div
                        key={item.kind === "ellipsis" ? item.key : `${item.element.tagName}-${item.index}`}
                     >
                        {idx > 0 && <span className="ex-tw-mx-1">{" > "}</span>}
                        {item.kind === "ellipsis" ? (
                           <span className="ex-tw-text-text4">...</span>
                        ) : (
                           <button
                              onClick={() => handleTargetSelect(item.element)}
                              className={`ex-tw-underline-offset-2 hover:ex-tw-underline ${
                                 item.element === selectedTarget
                                    ? "ex-tw-text-text5 ex-tw-font-semibold ex-tw-underline"
                                    : "ex-tw-text-text2"
                              }`}
                           >
                              {makeTargetLabel(item.element)}
                           </button>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            <div
               ref={bodyScrollRef}
               className="ex-tw-flex-1 ex-tw-min-h-0 ex-tw-overflow-auto ex-tw-p-4 ex-tw-relative"
            >
               <div className="ex-tw-gap-2 ex-tw-flex ex-tw-flex-col ex-tw-min-w-0">
                  <div className="ex-tw-flex ex-tw-justify-between">
                     <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text">Preview</h3>
                     <label
                        id="disable-Checkbox"
                        className="ex-tw-flex ex-tw-items-center ex-tw-gap-1 ex-tw-text-sm ex-tw-text-text3"
                     >
                        <input
                           type="checkbox"
                           checked={isDisabled}
                           onChange={(e) => setIsDisabled(e.target.checked)}
                           className="ex-tw-w-4 ex-tw-h-4"
                        />
                        Disable
                     </label>
                  </div>

                  <div
                     id="preview-area"
                     className="ex-tw-relative ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-h-[200px] ex-tw-overflow-hidden ex-tw-rounded-md ex-tw-bg-background2 ex-tw-p-4"
                  >
                     <div ref={previewRef} />
                  </div>

                  {previewClone &&
                     evtList.map((evt, i) => (
                        <div
                           id={`${evt}-area`}
                           key={`${evt}-${inputResetKey}-${i}`}
                           className="ex-tw-relative ex-tw-overflow-visible"
                        >
                           <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                              <div className="ex-tw-flex ex-tw-justify-between">
                                 <span>{evt}</span>
                                 {seedTags[evt].length === 0 && (
                                    <span className="ex-tw-text-xs ex-tw-font-normal ex-tw-text-text3">
                                       스타일 추출불가
                                    </span>
                                 )}
                              </div>
                              <ClassInput
                                 type={evt}
                                 preview={previewClone}
                                 seedTags={seedTags[evt]}
                                 seedKey={inputResetKey}
                              onTagsChange={(tags) => {
                                 const cleaned = cleanClassTokens(tags);
                                 setTagSnapshot((prev) => ({
                                    ...prev,
                                    [evt]: cleaned,
                                 }));
                              }}
                            />
                           </h3>
                        </div>
                     ))}
               </div>
            </div>
         </div>

         <aside
            onWheel={(e) => {
               const scroller = bodyScrollRef.current;
               if (!scroller) return;
               e.preventDefault();
               scroller.scrollTop += e.deltaY;
            }}
            className="ex-tw-absolute ex-tw-top-[62px] ex-tw-left-[calc(100%+10px)] ex-tw-w-[150px] ex-tw-flex ex-tw-flex-col ex-tw-gap-2 ex-tw-p-2 ex-tw-rounded-md ex-tw-border ex-tw-border-border1 ex-tw-bg-background1 ex-tw-shadow-lg dark:ex-tw-shadow-black/40"
         >
            <h3 className="ex-tw-font-medium ex-tw-text-sm ex-tw-text-text1">Presets</h3>
            <DropdownMenu<PresetSortType>
               options={presetSortOptions}
               value={presetSort}
               onChange={setPresetSort}
            />
            <input
               value={presetName}
               onChange={(e) => {
                  setPresetName(e.target.value);
                  if (presetError) setPresetError("");
               }}
               placeholder="Preset name"
               className="ex-tw-h-8 ex-tw-rounded ex-tw-border ex-tw-border-border1 ex-tw-bg-background2 ex-tw-px-2 ex-tw-text-xs ex-tw-text-text1 focus:ex-tw-outline-none focus:ex-tw-border-text5 dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-100 dark:ex-tw-border-slate-700 dark:focus:ex-tw-border-cyan-400"
            />
            <div
               className={`ex-tw-text-[11px] ex-tw-leading-4 ex-tw-transition-all ex-tw-duration-150 ${
                  presetError
                     ? "ex-tw-text-red-600 dark:ex-tw-text-red-400 ex-tw-opacity-100"
                     : "ex-tw-opacity-0"
               }`}
            >
               {presetError || "placeholder"}
            </div>
            <button
               onClick={savePreset}
               className={`ex-tw-h-8 ex-tw-rounded ex-tw-text-xs ex-tw-font-medium ex-tw-transition-all ex-tw-duration-150 ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-gap-1 ${
                  feedbackAction === "save"
                     ? "ex-tw-bg-emerald-600 ex-tw-text-white"
                     : "ex-tw-bg-text5 ex-tw-text-background1 hover:ex-tw-brightness-105 dark:ex-tw-bg-cyan-500 dark:ex-tw-text-slate-950 dark:hover:ex-tw-bg-cyan-400"
               }`}
            >
               {feedbackAction === "save" ? (
                  <>
                     <CheckIcon className="ex-tw-w-3 ex-tw-h-3 ex-tw-animate-bounce" />
                     Saved!
                  </>
               ) : (
                  "Save"
               )}
            </button>
            <div className="ex-tw-grid ex-tw-grid-cols-2 ex-tw-gap-1">
               <button
                  onClick={exportPresets}
                  className="ex-tw-h-8 ex-tw-rounded ex-tw-text-xs ex-tw-font-medium ex-tw-bg-background2 ex-tw-text-text2 ex-tw-border ex-tw-border-border1 hover:ex-tw-bg-background1 dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-100 dark:ex-tw-border-slate-700 dark:hover:ex-tw-bg-slate-700"
               >
                  Export
               </button>
               <button
                  onClick={openImportPicker}
                  className="ex-tw-h-8 ex-tw-rounded ex-tw-text-xs ex-tw-font-medium ex-tw-bg-background2 ex-tw-text-text2 ex-tw-border ex-tw-border-border1 hover:ex-tw-bg-background1 dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-100 dark:ex-tw-border-slate-700 dark:hover:ex-tw-bg-slate-700"
               >
                  Import
               </button>
            </div>
            <input
               ref={importInputRef}
               type="file"
               accept="application/json,.json"
               className="ex-tw-absolute ex-tw-w-px ex-tw-h-px ex-tw-opacity-0 ex-tw-pointer-events-none"
               onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                     void handleImportFile(file);
                  }
                  e.currentTarget.value = "";
               }}
            />
            <button
               onClick={updatePreset}
               disabled={!selectedPresetId || !presetName.trim()}
               className={`ex-tw-h-8 ex-tw-rounded ex-tw-text-xs ex-tw-font-medium ex-tw-transition-all ex-tw-duration-150 ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-gap-1 ${
                  selectedPresetId && presetName.trim()
                     ? feedbackAction === "update"
                        ? "ex-tw-bg-emerald-600 ex-tw-text-white ex-tw-border ex-tw-border-emerald-600"
                        : "ex-tw-bg-background2 ex-tw-text-text2 ex-tw-border ex-tw-border-border1 hover:ex-tw-bg-background1 dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-100 dark:ex-tw-border-slate-700 dark:hover:ex-tw-bg-slate-700"
                     : "ex-tw-bg-background2 ex-tw-text-text4 ex-tw-border ex-tw-border-border1 ex-tw-opacity-60 dark:ex-tw-bg-slate-800 dark:ex-tw-text-slate-500 dark:ex-tw-border-slate-700"
               }`}
            >
               {feedbackAction === "update" ? (
                  <>
                     <CheckIcon className="ex-tw-w-3 ex-tw-h-3 ex-tw-animate-bounce" />
                     Updated!
                  </>
               ) : (
                  "Update"
               )}
            </button>
            {feedbackAction === "import" && (
               <div className="ex-tw-h-6 ex-tw-rounded ex-tw-text-[11px] ex-tw-font-medium ex-tw-bg-emerald-600 ex-tw-text-white ex-tw-flex ex-tw-items-center ex-tw-justify-center">
                  Imported!
               </div>
            )}
            <DropdownMenu<string>
               options={presetDropdownOptions}
               value={selectedPresetId}
               onChange={applyPreset}
               placeholder="Select"
            />
            <div
               className={`ex-tw-rounded ex-tw-border ex-tw-border-border1 ex-tw-bg-background2 ex-tw-p-2 dark:ex-tw-bg-slate-800 dark:ex-tw-border-slate-700 ${
                  hasPresets ? "" : "ex-tw-opacity-60"
               }`}
            >
               <div className="ex-tw-text-[11px] ex-tw-font-medium ex-tw-text-text2 dark:ex-tw-text-slate-200">
                  선택한 상태만 적용
               </div>
               <div className="ex-tw-mt-1 ex-tw-grid ex-tw-grid-cols-2 ex-tw-gap-x-2 ex-tw-gap-y-1">
                  {evtList.map((evt) => (
                     <label
                        key={`scope-${evt}`}
                        className="ex-tw-flex ex-tw-items-center ex-tw-gap-1 ex-tw-text-[11px] ex-tw-text-text2 dark:ex-tw-text-slate-200"
                     >
                        <input
                           type="checkbox"
                           disabled={!hasPresets}
                           checked={applyScope[evt]}
                           onChange={(e) =>
                              setApplyScope((prev) => ({
                                 ...prev,
                                 [evt]: e.target.checked,
                              }))
                           }
                           className="ex-tw-h-3 ex-tw-w-3"
                        />
                        {evt}
                     </label>
                  ))}
               </div>
            </div>
            <button
               onClick={deletePreset}
               disabled={!selectedPresetId}
               className={`ex-tw-h-8 ex-tw-rounded ex-tw-text-xs ex-tw-font-medium ex-tw-transition-all ex-tw-duration-150 ex-tw-flex ex-tw-items-center ex-tw-justify-center ex-tw-gap-1 ${
                  selectedPresetId
                     ? feedbackAction === "delete"
                        ? "ex-tw-bg-red-700 ex-tw-text-white ex-tw-border ex-tw-border-red-700"
                        : "ex-tw-bg-red-50 ex-tw-text-red-700 ex-tw-border ex-tw-border-red-300 hover:ex-tw-bg-red-100 dark:ex-tw-bg-red-950/40 dark:ex-tw-text-red-300 dark:ex-tw-border-red-800 dark:hover:ex-tw-bg-red-900/40"
                     : "ex-tw-bg-red-50 ex-tw-text-red-300 ex-tw-border ex-tw-border-red-200 ex-tw-opacity-60 dark:ex-tw-bg-red-950/30 dark:ex-tw-text-red-500 dark:ex-tw-border-red-900"
               }`}
            >
               {feedbackAction === "delete" ? (
                  <>
                     <CheckIcon className="ex-tw-w-3 ex-tw-h-3 ex-tw-animate-bounce" />
                     Deleted!
                  </>
               ) : (
                  "Delete"
               )}
            </button>
         </aside>
      </div>
   );
}
