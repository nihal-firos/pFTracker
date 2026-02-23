import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReportsFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear: () => void;
  onExport: () => void;
  isExportDisabled: boolean;
}

export function ReportsFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  onExport,
  isExportDisabled,
}: ReportsFiltersProps): JSX.Element {
  return (
    <section className="rounded-xl border border-border/80 bg-card/70 p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">Start date</label>
          <Input type="date" value={startDate} onChange={(event) => onStartDateChange(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.14em] text-muted-foreground">End date</label>
          <Input type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} />
        </div>

        <Button variant="outline" onClick={onClear}>Clear</Button>
        <Button onClick={onExport} disabled={isExportDisabled}>Export CSV</Button>
      </div>
    </section>
  );
}