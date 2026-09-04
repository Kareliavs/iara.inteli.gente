import { MATURITY_LEVELS } from "@/data/mockData";

const levelColorClasses = {
  7: "bg-level-7",
  6: "bg-level-6",
  5: "bg-level-5",
  4: "bg-level-4",
  3: "bg-level-3",
  2: "bg-level-2",
  1: "bg-level-1",
};

const MaturityLevelLegend = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold c-green mb-4">Níveis de maturidade</h2>
      <div className="space-y-2">
        {MATURITY_LEVELS.map((item) => (
          <div key={item.level} className={`${levelColorClasses[item.level]} text-primary-foreground font-bold px-4 py-2.5 rounded-sm text-sm`}>
            {item.level} {item.title}
          </div>
        ))}
      </div>
    </div>
  );
};
export default MaturityLevelLegend;
