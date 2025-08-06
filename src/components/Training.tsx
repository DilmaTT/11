import { useState, useEffect, useMemo } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Trash2, BarChart2 } from "lucide-react";
import { CreateTrainingDialog } from "./CreateTrainingDialog";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { TrainingSession } from "./TrainingSession";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";


interface TrainingProps {
  isMobileMode?: boolean;
}

interface SessionStat {
  trainingId: string;
  timestamp: number;
  duration: number;
  totalQuestions: number;
  correctAnswers: number;
}

export const Training = ({ isMobileMode: propIsMobileMode = false }: TrainingProps) => {
  const isMobileHook = useIsMobile();
  const isMobileMode = propIsMobileMode || isMobileHook;

  const [trainings, setTrainings] = useState(() => {
    const saved = localStorage.getItem('training-sessions');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse training sessions from localStorage", e);
      return [];
    }
  });
  const [folders] = useState(() => {
    const saved = localStorage.getItem('poker-ranges-folders');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse folders from localStorage", e);
      return [];
    }
  });
  const [selectedTraining, setSelectedTraining] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTraining, setActiveTraining] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<SessionStat[]>([]);
  const [statsVersion, setStatsVersion] = useState(0);
  const [statsModalTrainingId, setStatsModalTrainingId] = useState<string | null>(null);
  const [modalStats, setModalStats] = useState<SessionStat[]>([]);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const statsModalTraining = trainings.find(t => t.id === statsModalTrainingId);

  // Auto-select the first training in desktop mode if none is selected
  useEffect(() => {
    if (!isMobileMode && trainings.length > 0 && !selectedTraining) {
      setSelectedTraining(trainings[0].id);
    }
  }, [isMobileMode, trainings, selectedTraining]);

  // Save trainings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('training-sessions', JSON.stringify(trainings));
  }, [trainings]);

  // Fetch detailed stats for main view
  useEffect(() => {
    if (selectedTraining) {
      const allStats = JSON.parse(localStorage.getItem('training-statistics') || '[]') as SessionStat[];
      const trainingStats = allStats
        .filter((stat) => stat.trainingId === selectedTraining)
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent
      setDetailedStats(trainingStats);
    } else {
      setDetailedStats([]);
    }
  }, [selectedTraining, statsVersion]);

  // Fetch stats for modal view
  useEffect(() => {
    if (statsModalTrainingId) {
      const allStats = JSON.parse(localStorage.getItem('training-statistics') || '[]') as SessionStat[];
      const trainingStats = allStats
        .filter((stat) => stat.trainingId === statsModalTrainingId)
        .sort((a, b) => b.timestamp - a.timestamp);
      setModalStats(trainingStats);
    } else {
      setModalStats([]);
    }
  }, [statsModalTrainingId]);


  // Calculate and update training statistics
  const getTrainingStats = (trainingId: string) => {
    const savedStats = JSON.parse(localStorage.getItem('training-statistics') || '[]');
    const trainingStats = savedStats.filter((stat: any) => stat.trainingId === trainingId);
    
    if (trainingStats.length === 0) return null;
    
    const totalSessions = trainingStats.length;
    const totalHands = trainingStats.reduce((sum: number, stat: any) => sum + stat.totalQuestions, 0);
    const totalCorrect = trainingStats.reduce((sum: number, stat: any) => sum + stat.correctAnswers, 0);
    const totalTime = trainingStats.reduce((sum: number, stat: any) => sum + stat.duration, 0);
    
    const avgAccuracy = totalHands > 0 ? (totalCorrect / totalHands) * 100 : 0;
    const avgTime = totalSessions > 0 ? totalTime / totalSessions : 0;
    const avgTimeMinutes = Math.floor(avgTime / 60000);
    const avgTimeSeconds = Math.floor((avgTime % 60000) / 1000);
    
    return {
      accuracy: avgAccuracy.toFixed(1),
      hands: totalHands,
      time: `${avgTimeMinutes}:${avgTimeSeconds.toString().padStart(2, '0')}`,
      sessions: totalSessions
    };
  };

  const getTrainingSubtypeText = (training: any) => {
    if (training.type === 'classic') {
      if (!training.subtype) return null;
      if (training.subtype === 'all-hands') return 'Все руки';
      if (training.subtype === 'border-check') {
        // Handle old data that might not have this property
        if (training.borderExpansionLevel === undefined) {
          return 'Граница ренжа (+0)';
        }
        return `Граница ренжа (+${training.borderExpansionLevel})`;
      }
    } else if (training.type === 'border-repeat') {
      // Handle old data that might not have this property
      if (training.rangeSelectionOrder === 'random') {
        return 'Случайный порядок';
      }
      return 'По порядку'; // Default for old data and 'sequential'
    }
    return null;
  };

  const handleCreateTraining = (training: any) => {
    setTrainings(prev => [training, ...prev]); // Place new training at the top
  };

  const handleDeleteTraining = (trainingId: string) => {
    setTrainings(prev => prev.filter(t => t.id !== trainingId));
    if (selectedTraining === trainingId) {
      setSelectedTraining(null);
    }
    // Also delete associated stats
    const allStats = JSON.parse(localStorage.getItem('training-statistics') || '[]');
    const remainingStats = allStats.filter((stat: SessionStat) => stat.trainingId !== trainingId);
    localStorage.setItem('training-statistics', JSON.stringify(remainingStats));
    setStatsVersion(v => v + 1); // force refresh
  };

  const handleConfirmDelete = () => {
    if (deleteCandidateId) {
      handleDeleteTraining(deleteCandidateId);
      setDeleteCandidateId(null);
    }
  };

  const handleStartTraining = (trainingId: string) => {
    const training = trainings.find(t => t.id === trainingId);
    if (training) {
      setActiveTraining(training);
    }
  };

  const handleTrainingComplete = () => {
    setActiveTraining(null);
    // Increment statsVersion to force a re-fetch of statistics
    setStatsVersion(v => v + 1);
  };

  const formatLongDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}ч`);
    if (minutes > 0) parts.push(`${minutes}м`);
    if (seconds > 0 || totalSeconds === 0) {
        parts.push(`${seconds}с`);
    }
    
    return parts.join(' ') || '0с';
  };

  const formatSessionDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSessionDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateSessionAccuracy = (correct: number, total: number) => {
    if (total === 0) return '0.0';
    return ((correct / total) * 100).toFixed(1);
  };

  const summaryStats = useMemo(() => {
    if (modalStats.length === 0) {
      return { totalDuration: 0, totalAccuracy: 0 };
    }

    const totalDuration = modalStats.reduce((acc, stat) => acc + stat.duration, 0);
    const totalCorrect = modalStats.reduce((acc, stat) => acc + stat.correctAnswers, 0);
    const totalQuestions = modalStats.reduce((acc, stat) => acc + stat.totalQuestions, 0);
    const totalAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return { totalDuration, totalAccuracy };
  }, [modalStats]);

  if (activeTraining) {
    return (
      <TrainingSession 
        training={activeTraining} 
        onStop={handleTrainingComplete} 
      />
    );
  }

  return (
    <>
      <div className={cn(
        "bg-background",
        isMobileMode ? "flex flex-col h-full" : "flex h-screen"
      )}>
        {/* Sidebar */}
        <div className={cn(
          "bg-card p-4 space-y-4",
          isMobileMode ? "order-2 flex-1 flex flex-col" : "w-80 border-r"
        )}>
          <div>
            <h2 className="text-lg font-semibold">Тренировки</h2>
          </div>
          
          <div className={cn(
            "space-y-2 overflow-y-auto",
            isMobileMode ? "flex-1" : "flex-1"
          )}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Созданные тренировки</h3>
            {trainings.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Не создано ни одной тренировки
                </p>
              </Card>
            ) : (
              trainings.map((training) => {
                const stats = getTrainingStats(training.id);
                const isSelected = selectedTraining === training.id;
                const subtypeText = getTrainingSubtypeText(training);

                return (
                  <Card 
                    key={training.id} 
                    className={cn(
                      'cursor-pointer transition-all duration-300',
                      isMobileMode ? 'py-1 px-2' : (isSelected ? 'p-3' : 'py-1 px-3'), // Changed py-2 to py-1 for desktop unselected
                      isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedTraining(prev => prev === training.id ? null : training.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium truncate my-0">{training.name}</h4>
                        <div className={cn(
                          "transition-all duration-300 ease-in-out overflow-hidden",
                          isSelected ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0" // Changed condition here
                        )}>
                          <div className="text-xs text-muted-foreground">
                            {training.type === 'classic' ? 'Классическая' : 'Повторение границ'}
                            {subtypeText && ` • ${subtypeText}`}
                          </div>
                          {stats && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Точность: {stats.accuracy}% • Сессий: {stats.sessions}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isMobileMode && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setStatsModalTrainingId(training.id);
                              }}
                            >
                              <BarChart2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartTraining(training.id);
                              }}
                            >
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className={isMobileMode ? "h-6 px-1" : ""}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCandidateId(training.id);
                          }}
                        >
                          <Trash2 className={cn(isMobileMode ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <Button 
            className="w-full" 
            variant="poker"
            onClick={() => setShowCreateDialog(true)}
          >
            Создать тренировку
          </Button>
        </div>

        {/* Main Content */}
        {!isMobileMode && (
          <div className={cn(
            "p-6",
            isMobileMode ? "order-1 flex-1" : "flex-1 overflow-y-auto"
          )}>
            <div className={cn(
              "mx-auto space-y-6",
              isMobileMode ? "max-w-full" : "max-w-4xl"
            )}>
              {selectedTraining ? (
                <div>
                  {(() => {
                    const training = trainings.find(t => t.id === selectedTraining);
                    if (!training) return null;
                    
                    const stats = getTrainingStats(training.id);
                    const subtypeText = getTrainingSubtypeText(training);
                    
                    const folder = folders.find(f => f.id === training.folderId);
                    const folderName = folder ? folder.name : null;
                    const rangeNames = training.rangeIds?.map(rangeId => {
                        const r = folder?.ranges.find(r => r.id === rangeId);
                        return r ? r.name : null;
                    }).filter(Boolean).join(', ');

                    return (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="p-2">
                            <CardTitle className="text-center text-lg">{training.name}</CardTitle>
                            <CardDescription className="text-center text-xs">
                              {training.type === 'classic' ? 'Классическая тренировка' : 'Тренировка повторения границ'}
                              {subtypeText && ` • ${subtypeText}`}
                            </CardDescription>
                            {(folderName || rangeNames) && (
                              <div className="text-xs text-muted-foreground text-center pt-1 border-t mt-1">
                                {folderName && <p><strong>Папка:</strong> {folderName}</p>}
                                {rangeNames && <p className="truncate" title={rangeNames}><strong>Ренжи:</strong> {rangeNames}</p>}
                              </div>
                            )}
                          </CardHeader>
                        </Card>

                        {/* Training Stats */}
                        {stats ? (
                          <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Статистика всех сессий</h3>
                            <div className={cn(
                              "gap-4 text-center",
                              isMobileMode ? "grid grid-cols-2 space-y-2" : "grid grid-cols-4"
                            )}>
                              <div>
                                <div className="text-2xl font-bold text-primary">{stats.accuracy}%</div>
                                <div className="text-sm text-muted-foreground">Точность</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-primary">{stats.hands}</div>
                                <div className="text-sm text-muted-foreground">Рук сыграно</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-primary">{stats.time}</div>
                                <div className="text-sm text-muted-foreground">Среднее время</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-primary">{stats.sessions}</div>
                                <div className="text-sm text-muted-foreground">Сессий</div>
                              </div>
                            </div>
                          </Card>
                        ) : (
                          <Card className="p-6 text-center text-muted-foreground">
                            Начните тренировку, чтобы собрать статистику.
                          </Card>
                        )}

                        {/* Start Training Button */}
                        <div className="text-center">
                          <Button 
                            size="lg" 
                            variant="poker"
                            onClick={() => handleStartTraining(training.id)}
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Запустить тренировку
                          </Button>
                        </div>

                        {/* Detailed Session History (PC only) */}
                        {!isMobileMode && (
                          <Card>
                            <CardHeader>
                              <CardTitle>История сессий</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {detailedStats.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[100px]">Сессия</TableHead>
                                      <TableHead>Дата</TableHead>
                                      <TableHead>Время</TableHead>
                                      <TableHead className="text-right">Точность</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {detailedStats.map((session, index) => (
                                      <TableRow key={session.timestamp}>
                                        <TableCell className="font-medium">{detailedStats.length - index}</TableCell>
                                        <TableCell>{formatSessionDate(session.timestamp)}</TableCell>
                                        <TableCell>{formatSessionDuration(session.duration)}</TableCell>
                                        <TableCell className="text-right">
                                          {calculateSessionAccuracy(session.correctAnswers, session.totalQuestions)}%
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <div className="text-center text-muted-foreground py-8">
                                  Нет данных о сессиях для этой тренировки.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                !isMobileMode && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <h2 className="text-xl font-semibold">Тренировка ренжей</h2>
                      <p>Выберите тренировку из списка слева или создайте новую.</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      <CreateTrainingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateTraining={handleCreateTraining}
      />

      {isMobileMode && (
        <Dialog open={!!statsModalTrainingId} onOpenChange={(isOpen) => { if (!isOpen) setStatsModalTrainingId(null); }}>
          <DialogContent mobileFullscreen className="flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>{statsModalTraining?.name}</DialogTitle>
              <DialogDesc>История сессий</DialogDesc>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {modalStats.length > 0 ? (
                <div className="space-y-2 py-4">
                  {modalStats.map((session, index) => (
                    <Card key={session.timestamp} className="p-3">
                      <div className="grid grid-cols-3 items-center gap-4 text-sm">
                        <div className="font-medium">
                          <p>Сессия {modalStats.length - index}</p>
                          <p className="text-xs text-muted-foreground">{formatSessionDate(session.timestamp)}</p>
                        </div>
                        <div className="text-center text-muted-foreground">
                          {formatSessionDuration(session.duration)}
                        </div>
                        <div className="text-right font-semibold">
                          {calculateSessionAccuracy(session.correctAnswers, session.totalQuestions)}%
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  Нет данных о сессиях для этой тренировки.
                </div>
              )}
            </div>
            {modalStats.length > 0 && (
              <div className="flex-shrink-0 border-t mt-auto p-4 bg-card/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">Общее время</div>
                    <div className="text-lg font-bold">{formatLongDuration(summaryStats.totalDuration)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Общая точность</div>
                    <div className="text-lg font-bold">{summaryStats.totalAccuracy.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteCandidateId} onOpenChange={(isOpen) => { if (!isOpen) setDeleteCandidateId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие невозможно отменить. Это приведет к необратимому удалению тренировки и всей связанной с ней статистики.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
