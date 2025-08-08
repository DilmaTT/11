import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoredChart } from "@/types/chart";
import { Loader2 } from "lucide-react";

// Предполагаемые типы данных из localStorage для ясности
interface Range {
  id: string;
  name: string;
}

interface Folder {
  id: string;
  name: string;
  ranges: Range[];
}

// Статистика хранится как { [rangeId: string]: number }
type StatsData = Record<string, number>;

interface ProcessedStat {
  id: string;
  folderName: string;
  rangeName: string;
  count: number;
}

interface ChartStatsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  chart: StoredChart | null;
}

export const ChartStatsDialog = ({ isOpen, onOpenChange, chart }: ChartStatsDialogProps) => {
  const [stats, setStats] = useState<ProcessedStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !chart) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Получаем данные из localStorage
      const rawStats = localStorage.getItem('training-statistics');
      const allStats: StatsData = rawStats ? JSON.parse(rawStats) : {};

      const rawFolders = localStorage.getItem('poker-ranges-folders');
      const allFolders: Folder[] = rawFolders ? JSON.parse(rawFolders) : [];

      // 2. Создаем карту для быстрого поиска названий по ID ренджа
      const rangeDetailsMap = new Map<string, { folderName: string; rangeName: string }>();
      allFolders.forEach(folder => {
        folder.ranges.forEach(range => {
          rangeDetailsMap.set(range.id, { folderName: folder.name, rangeName: range.name });
        });
      });

      // 3. Собираем все уникальные ID ренджей, связанных с этим чартом
      const chartRangeIds = new Set<string>();
      chart.buttons.forEach(button => {
        if (button.type === 'normal' && button.linkedItem && button.linkedItem !== 'label-only' && button.linkedItem !== 'exit') {
          chartRangeIds.add(button.linkedItem);
        }
        if (button.linkButtons) {
          button.linkButtons.forEach(linkBtn => {
            if (linkBtn.enabled && linkBtn.targetRangeId) {
              chartRangeIds.add(linkBtn.targetRangeId);
            }
          });
        }
      });

      // 4. Обрабатываем статистику для всех найденных ренджей
      const processedStats: ProcessedStat[] = Array.from(chartRangeIds).map(rangeId => {
        const count = Number(allStats[rangeId]) || 0; // Ensure count is a number
        const details = rangeDetailsMap.get(rangeId);
        return {
          id: rangeId,
          folderName: details ? details.folderName : "Удаленная папка",
          rangeName: details ? details.rangeName : `(Ренж не найден)`,
          count: count,
        };
      });

      // 5. Сортируем по количеству и берем топ-10
      const topStats = processedStats
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setStats(topStats);
    } catch (error) {
      console.error("Ошибка при обработке статистики чарта:", error);
      setStats([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, chart]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Статистика для "{chart?.name}"</DialogTitle>
          <DialogDescription>
            10 самых популярных ренджей в этом чарте.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2">
              {stats.filter(stat => stat.count > 0).map((stat) => (
                <li key={stat.id} className="text-sm">
                  <span className="font-medium">{stat.folderName} - {stat.rangeName}:</span>
                  <span className="text-muted-foreground ml-2">{stat.count} обращений</span>
                </li>
              ))}
              {stats.filter(stat => stat.count > 0).length === 0 && (
                 <div className="text-center text-muted-foreground py-8">
                    <p>Нет данных об обращениях к ренджам в этом чарте.</p>
                 </div>
              )}
            </ol>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Нет связанных ренджей для отображения статистики.</p>
              <p className="text-xs mt-1">Добавьте в чарт кнопки, которые ссылаются на ренджи.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
