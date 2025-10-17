import ClassInput from "../../components/ClassInput";

export default function TesterPopover({ target }: { target: HTMLElement }) {
   return (
      <div
         onMouseDown={(e) => e.stopPropagation()}
         className="ex-tw-absolute ex-tw-rounded-md ex-tw-w-full ex-tw-h-full ex-tw-font-inter 
              ex-tw-border-border1 ex-tw-border-2 ex-tw-overflow-auto 
              ex-tw-bg-background1 ex-tw-shadow-lg
              ex-tw-transition-transform ex-tw-duration-150"
         style={{
            zIndex: 9999,
         }}
      >
         <div
            id="tw-drag-handle"
            className="ex-tw-w-full ex-tw-relative ex-tw-border-border1 ex-tw-border-b-2 ex-tw-py-4  ex-tw-pl-4 ex-tw-select-none"
         >
            <h2 className="ex-tw-text-xl ex-tw-font-bold ex-tw-text-text5">Tailwind UI Tester</h2>
         </div>
         <div id="classAdd-area" className="ex-tw-gap-2 ex-tw-flex ex-tw-flex-col ex-tw-p-4">
            <div className="ex-tw-relative ex-tw-overflow-visible">
               <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                  Click
                  <ClassInput placeholder="Click 클래스 입력" target={target} />
               </h3>
            </div>
            <div>
               <div className="ex-tw-relative ex-tw-overflow-visible">
                  <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                     Disable
                     <ClassInput placeholder="Disable 클래스 입력" target={target} />
                  </h3>
               </div>
            </div>
            <div>
               <div className="ex-tw-relative ex-tw-overflow-visible">
                  <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                     hover
                     <ClassInput placeholder="hover 클래스 입력" target={target} />
                  </h3>
               </div>
            </div>
            <div>
               <div className="ex-tw-relative ex-tw-overflow-visible">
                  <h3 className="ex-tw-font-medium ex-tw-text-lg ex-tw-text-text1">
                     Focus
                     <ClassInput placeholder="Focus 클래스 입력" target={target} />
                  </h3>
               </div>
            </div>
         </div>
      </div>
   );
}
