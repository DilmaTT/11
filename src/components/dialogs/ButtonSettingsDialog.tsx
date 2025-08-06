import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChartButton } from "@/types/chart";
import { StoredRange } from '@/types/range';
import { Folder } from '@/contexts/RangeContext'; // Import Folder type
import { cn } from "@/lib/utils"; // Import cn for conditional class names

interface ButtonSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isMobileMode: boolean;
  editingButton: ChartButton | null;
  setEditingButton: React.Dispatch<React.SetStateAction<ChartButton | null>>;
  onSave: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  allRanges: StoredRange[];
  folders: Folder[]; // New prop for folders
  onOpenLegendPreview: () => void;
}

export const ButtonSettingsDialog = ({
  isOpen,
  onOpenChange,
  isMobileMode,
  editingButton,
  setEditingButton,
  onSave,
  onCancel,
  onDuplicate,
  onDelete,
  allRanges,
  folders, // Destructure new prop
  onOpenLegendPreview,
}: ButtonSettingsDialogProps) => {

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const predefinedColors = [
    { name: 'Красный', hex: '#FF0000' },
    { name: 'Зеленый', hex: '#2FCA2F' },
    { name: 'Синий', hex: '#0000FF' },
    { name: 'Оранжевый', hex: '#FFA500' },
    { name: 'Фиолетовый', hex: '#800080' },
  ];

  useEffect(() => {
    if (editingButton && editingButton.type === 'normal' && editingButton.linkedItem) {
      const linkedRange = allRanges.find(r => r.id === editingButton.linkedItem);
      if (linkedRange) {
        const folder = folders.find(f => f.ranges.some(r => r.id === linkedRange.id));
        if (folder) {
          setSelectedFolderId(folder.id);
        } else {
          setSelectedFolderId(null);
        }
      } else {
        setSelectedFolderId(null);
      }
    } else {
      setSelectedFolderId(null);
    }
  }, [editingButton, folders, allRanges]);

  const handleTypeChange = (value: 'normal' | 'label' | 'exit') => {
    setEditingButton(prev => {
      if (!prev) return null;
      let newLinkedItem = prev.linkedItem;
      if (value === 'label') {
        newLinkedItem = 'label-only';
      } else if (value === 'exit') {
        newLinkedItem = 'exit-chart-placeholder';
      } else if (value === 'normal' && prev.type !== 'normal') {
        if (allRanges.length > 0) {
          const firstRange = allRanges[0];
          newLinkedItem = firstRange.id;
        } else {
          newLinkedItem = '';
        }
      }
      return { ...prev, type: value, linkedItem: newLinkedItem };
    });
  };

  const handleFolderChange = (folderId: string) => {
    setSelectedFolderId(folderId);
    const folder = folders.find(f => f.id === folderId);
    const firstRangeInFolder = folder?.ranges[0];
    setEditingButton(prev => {
      if (!prev) return null;
      return { ...prev, linkedItem: firstRangeInFolder ? firstRangeInFolder.id : '' };
    });
  };

  const handleRangeChange = (rangeId: string) => {
    setEditingButton(prev => prev ? { ...prev, linkedItem: rangeId } : null);
  };

  const rangesInSelectedFolder = selectedFolderId
    ? folders.find(f => f.id === selectedFolderId)?.ranges || []
    : [];

  const currentRangeId = editingButton?.type === 'normal' ? editingButton.linkedItem : '';

  if (!editingButton) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onCancel();
      } else {
        onOpenChange(true);
      }
    }}>
      <DialogContent mobileFullscreen={isMobileMode}>
        <DialogHeader>
          <DialogTitle>Настройка кнопки</DialogTitle>
        </DialogHeader>
        <div className={cn(
          "grid",
          isMobileMode ? "gap-3.5 py-3.5" : "gap-4 py-4"
        )}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buttonName" className="text-right">
              Название
            </Label>
            <Input
              id="buttonName"
              value={editingButton?.name || ""}
              onChange={(e) => setEditingButton(prev => prev ? { ...prev, name: e.target.value } : null)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buttonColor" className="text-right">
              Цвет
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              {predefinedColors.map((pc) => (
                <div
                  key={pc.hex}
                  className="w-8 h-8 rounded-md cursor-pointer border border-gray-700"
                  style={{ backgroundColor: pc.hex }}
                  onClick={() => setEditingButton(prev => prev ? { ...prev, color: pc.hex } : null)}
                  title={pc.name}
                />
              ))}
              <Input
                id="buttonColor"
                type="color"
                value={editingButton?.color || "#000000"}
                onChange={(e) => setEditingButton(prev => prev ? { ...prev, color: e.target.value } : null)}
                className="w-10 h-10 p-0 border-none cursor-pointer"
              />
            </div>
          </div>

          {/* New Button Type selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Тип кнопки</Label>
            <RadioGroup
              value={editingButton?.type || 'normal'}
              onValueChange={handleTypeChange}
              className="col-span-3 flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="typeNormal" />
                <Label htmlFor="typeNormal" className="font-normal">Обычная</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="label" id="typeLabel" />
                <Label htmlFor="typeLabel" className="font-normal">Только текст</Label>
              </div>
              {!isMobileMode && ( // Conditionally render "Выход" only if not mobile
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exit" id="typeExit" />
                  <Label htmlFor="typeExit" className="font-normal">Выход</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Conditional rendering for Folder and Range selects */}
          {editingButton.type === 'normal' && (
            <>
              {isMobileMode ? (
                // Mobile compact layout: "Привязать" label and two dropdowns on one line
                <div className="flex items-center gap-2">
                  <Label className="font-bold whitespace-nowrap">Привязать</Label>
                  <Select
                    value={selectedFolderId || ''}
                    onValueChange={handleFolderChange}
                    disabled={folders.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Папка" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.length === 0 ? (
                        <SelectItem value="no-folders-available" disabled>Нет доступных папок</SelectItem>
                      ) : (
                        folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Select
                    value={currentRangeId}
                    onValueChange={handleRangeChange}
                    disabled={!selectedFolderId || rangesInSelectedFolder.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Диапазон" />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedFolderId ? (
                        <SelectItem value="select-folder-first" disabled>Сначала выберите папку</SelectItem>
                      ) : rangesInSelectedFolder.length === 0 ? (
                        <SelectItem value="no-ranges-in-folder" disabled>Нет диапазонов в этой папке</SelectItem>
                      ) : (
                        rangesInSelectedFolder.map(range => (
                          <SelectItem key={range.id} value={range.id}>
                            {range.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // Desktop layout: Folder and Range selects on separate lines
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="linkedFolder" className="text-right">
                      Папка
                    </Label>
                    <Select
                      value={selectedFolderId || ''}
                      onValueChange={handleFolderChange}
                      disabled={folders.length === 0}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Выберите папку" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.length === 0 ? (
                          <SelectItem value="no-folders-available" disabled>Нет доступных папок</SelectItem>
                        ) : (
                          folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="linkedRange" className="text-right">
                      Диапазон
                    </Label>
                    <Select
                      value={currentRangeId}
                      onValueChange={handleRangeChange}
                      disabled={!selectedFolderId || rangesInSelectedFolder.length === 0}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Выберите диапазон" />
                      </SelectTrigger>
                      <SelectContent>
                        {!selectedFolderId ? (
                          <SelectItem value="select-folder-first" disabled>Сначала выберите папку</SelectItem>
                        ) : rangesInSelectedFolder.length === 0 ? (
                          <SelectItem value="no-ranges-in-folder" disabled>Нет диапазонов в этой папке</SelectItem>
                        ) : (
                          rangesInSelectedFolder.map(range => (
                            <SelectItem key={range.id} value={range.id}>
                              {range.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          <div className={cn(
            "grid grid-cols-4 items-center gap-4 border-t",
            isMobileMode ? "pt-3.5 mt-1.5" : "pt-4 mt-2"
          )}>
            <Label className="text-right">Шрифт</Label>
            <div className={cn(
              "col-span-3 flex flex-wrap items-center gap-x-4",
              isMobileMode ? "gap-y-1.5" : "gap-y-2"
            )}>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adaptiveFont"
                  checked={editingButton?.isFontAdaptive ?? true}
                  onCheckedChange={(checked) => {
                    setEditingButton(prev => prev ? { ...prev, isFontAdaptive: !!checked } : null);
                  }}
                />
                <Label htmlFor="adaptiveFont" className="font-normal">Адаптивный</Label>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  id="fontSize"
                  type="number"
                  value={editingButton?.fontSize || 16}
                  onChange={(e) => setEditingButton(prev => prev ? { ...prev, fontSize: parseInt(e.target.value) || 16 } : null)}
                  className="w-16 h-8"
                  min="1"
                  disabled={editingButton?.isFontAdaptive ?? true}
                />
                <Label htmlFor="fontSize" className="font-normal text-sm text-muted-foreground">px</Label>
              </div>

              <RadioGroup
                value={editingButton?.fontColor || 'white'}
                onValueChange={(value: 'white' | 'black') => {
                  setEditingButton(prev => prev ? { ...prev, fontColor: value } : null);
                }}
                className="flex gap-4"
                disabled={editingButton?.isFontAdaptive ?? true}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="fontWhite" />
                  <Label htmlFor="fontWhite" className="font-normal">Белый</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="black" id="fontBlack" />
                  <Label htmlFor="fontBlack" className="font-normal">Черный</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Group for Size (Width, Height) */}
          <div className={cn(
            "grid grid-cols-4 items-center gap-4 border-t",
            isMobileMode ? "pt-3.5 mt-1.5" : "pt-4 mt-2"
          )}>
            <Label className="text-right">Размер</Label>
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="buttonWidth" className="font-normal w-6 text-right">W:</Label>
                <Input
                  id="buttonWidth"
                  type="number"
                  value={editingButton?.width || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, width: isNaN(value) ? 0 : value } : null);
                  }}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="buttonHeight" className="font-normal w-6 text-right">H:</Label>
                <Input
                  id="buttonHeight"
                  type="number"
                  value={editingButton?.height || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, height: isNaN(value) ? 0 : value } : null);
                  }}
                  className="w-20 h-8"
                />
              </div>
            </div>
          </div>

          {/* Group for Position (X, Y) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Позиция</Label>
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="buttonX" className="font-normal w-6 text-right">X: </Label>
                <Input
                  id="buttonX"
                  type="number"
                  value={editingButton?.x || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, x: isNaN(value) ? 0 : value } : null);
                  }}
                  className="w-20 h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="buttonY" className="font-normal w-6 text-right">Y:</Label>
                <Input
                  id="buttonY"
                  type="number"
                  value={editingButton?.y || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setEditingButton(prev => prev ? { ...prev, y: isNaN(value) ? 0 : value } : null);
                  }}
                  className="w-20 h-8"
                />
              </div>
            </div>
          </div>

          <div className={cn(
            "grid grid-cols-4 items-start gap-4 border-t",
            isMobileMode ? "pt-3.5 mt-1.5" : "pt-4 mt-2"
          )}>
            <Label className="text-right col-start-1 pt-2">Опции</Label>
            <div className="col-span-3 flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                  <Checkbox
                      id="showLegend"
                      checked={editingButton?.showLegend ?? false}
                      onCheckedChange={(checked) => {
                          setEditingButton(prev => prev ? { ...prev, showLegend: !!checked } : null);
                      }}
                      disabled={editingButton?.type === 'label' || editingButton?.type === 'exit'}
                  />
                  <Label htmlFor="showLegend" className="font-normal">
                      Показать легенду
                  </Label>
                  {editingButton?.showLegend && editingButton?.type === 'normal' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 ml-2"
                      onClick={onOpenLegendPreview}
                    >
                      Предпросмотр
                    </Button>
                  )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                    id="showRandomizer"
                    checked={editingButton?.showRandomizer ?? false}
                    onCheckedChange={(checked) => {
                        setEditingButton(prev => prev ? { ...prev, showRandomizer: !!checked } : null);
                    }}
                    disabled={editingButton?.type === 'label' || editingButton?.type === 'exit'}
                />
                <Label htmlFor="showRandomizer" className="font-normal">
                    Показывать рандомайзер
                </Label>
              </div>
            </div>
          </div>

        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={onDelete}>Удалить</Button>
          <Button variant="outline" onClick={onDuplicate}>Копировать</Button>
          <Button onClick={onSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
