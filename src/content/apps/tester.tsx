export default function TesterPopover({ target }: { target: HTMLElement }) {
   return (
      <div
         onMouseDown={(e) => e.stopPropagation()}
         className="ex-tw-absolute ex-tw-rounded-md ex-tw-w-full ex-tw-h-full ex-tw-font-inter 
              ex-tw-border-border1 ex-tw-border-2 ex-tw-overflow-auto 
              ex-tw-bg-background1 ex-tw-shadow-lg ex-tw-p-4 
              ex-tw-transition-transform ex-tw-duration-150"
         style={{
            zIndex: 9999,
         }}
      ></div>
   );
}
