export default {
   prefix: "ex-tw-",
   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
   theme: {
      extend: {
         fontFamily: {
            inter: ["Inter"],
         },
         colors: {
            background1: "var(--color-background1)",
            text1: "var(--color-text1)",
            text2: "var(--color-text2)",
            text3: "var(--color-text3)",
            text4: "var(--color-text4)",
            text5: "var(--color-text5)",
            border1: "var(--color-border1)",
         },
      },
   },
};
