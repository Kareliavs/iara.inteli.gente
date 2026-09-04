import { Info } from "lucide-react";

const CharacterizationTable = ({ title, items }) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3">
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-foreground">{item.label}</span>
            <span className="flex items-center gap-1 text-foreground font-medium">
              {item.value}
              <Info className="w-4 h-4 text-brand-cyan cursor-pointer" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CharacterizationTable;
