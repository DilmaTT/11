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
import { Loader2, Trash2 } from "lucide-react";
import { resetRangeAccessStats } from "@/lib/data-manager";

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
  const [isResetting, setIsResetting] = useState(false);

  const fetchStats = () => {
    if (!isOpen || !chart) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Получаем данные из localStorage
      const rawStats = localStorage.getItem('poker-range-access-statistics');
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
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, chart]);

  const handleResetStats = async () => {
    if (window.confirm("Вы уверены, что хотите сбросить всю статистику обращений к ренджам? Это действие необратимо и затронет данные в облаке, если вы авторизованы.")) {
      setIsResetting(true);
      try {
        await resetRangeAccessStats();
        // Refresh the stats displayed in the dialog by re-fetching
        fetchStats();
      } catch (error) {
        console.error("Failed to reset stats:", error);
        // Alert is handled in data-manager
      } finally {
        setIsResetting(false);
      }
    }
  };

  const hasStatsData = stats.filter(stat => stat.count > 0).length > 0;

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
          ) : hasStatsData ? (
            <ol className="list-decimal list-inside space-y-2">
              {stats.filter(stat => stat.count > 0).map((stat) => (
                <li key={stat.id} className="text-sm">
                  <span className="font-medium">{stat.folderName} - {stat.rangeName}:</span>
                  <span className="text-muted-foreground ml-2">{stat.count} обращений</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Нет данных об обращениях к ренджам в этом чарте.</p>
            </div>
          )}
        </div>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:space-x-2">
          <Button
            variant="destructive"
            onClick={handleResetStats}
            disabled={isResetting || isLoading || !hasStatsData}
            className="w-full sm:w-auto"
          >
            {isResetting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Сбросить статистику
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
