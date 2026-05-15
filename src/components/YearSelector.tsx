'use client';

interface YearSelectorProps {
  currentYear: number;
  onChange: (year: number) => void;
}

export default function YearSelector({ currentYear, onChange }: YearSelectorProps) {
  const years = [];
  const startYear = new Date().getFullYear() + 1;
  for (let i = 0; i < 10; i++) {
    years.push(startYear - i);
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="year-select" className="text-xs font-bold uppercase tracking-widest text-white/40">
        Tax Year:
      </label>
      <select
        id="year-select"
        value={currentYear}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm font-bold focus:border-accent transition-colors"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
