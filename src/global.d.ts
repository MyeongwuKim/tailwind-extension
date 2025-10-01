export {};
declare global {
   type Category = "Typography" | "Color" | "Box Model" | "Layout" | "Effects" | "Other";

   type ClassCategoryMap = Record<Category, string[]>;
}

declare module "postcss-safe-parser";
