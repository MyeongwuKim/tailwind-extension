interface CssRowProps {
   property: string;
   value: string;
   tw: string;
}

export default function CssRow({ property, value, tw }: CssRowProps) {
   return (
      <div className="flex justify-between gap-2 mb-1">
         <span className="text-gray-400">
            {property}: {value}
         </span>
         <span className="text-cyan-400">{tw}</span>
      </div>
   );
}
