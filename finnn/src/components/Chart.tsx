import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Play, Edit, Trash2 } from "lucide-react";
import { StoredChart } from "@/types/chart";
import { cn } from "@/lib/utils";

const getButtonNoun = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'кнопок';
  }
  if (lastDigit === 1) {
    return 'кнопка';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'кнопки';
  }
  return 'кнопок';
};

interface ChartProps {
  isMobileMode?: boolean;
  charts: StoredChart[];
  onCreateChart: (name: string) => void;
  onDeleteChart: (id: string) => void;
  onEditChart: (chart: StoredChart) => void;
  onPlayChart: (chart: StoredChart) => void;
}

export const Chart = ({ isMobileMode, charts, onCreateChart, onDeleteChart, onEditChart, onPlayChart }: ChartProps) => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChartName, setNewChartName] = useState("");

  const handleCreate = () => {
    if (newChartName.trim()) {
      onCreateChart(newChartName.trim());
      setNewChartName("");
      setCreateDialogOpen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Чарты</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Создать чарт
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый чарт</DialogTitle>
                <DialogDescription>
                  Введите название для вашего нового чарта.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={newChartName}
                onChange={(e) => setNewChartName(e.target.value)}
                placeholder="Название чарта"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newChartName.trim()}>
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className={cn(
          "space-y-3",
          isMobileMode && "max-h-[calc(70vh)] overflow-y-auto pr-1"
        )}>
          {charts.length > 0 ? (
            charts.map((chart) => (
              <Card key={chart.id} className="transition-all hover:bg-muted/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 overflow-hidden mr-2">
                    <h3 className="font-semibold truncate">{chart.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {chart.buttons.length} {getButtonNoun(chart.buttons.length)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onPlayChart(chart); }}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEditChart(chart); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); onDeleteChart(chart.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">Чарты не найдены</h3>
              <p className="text-muted-foreground mt-1">Создайте свой первый чарт, чтобы начать.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
