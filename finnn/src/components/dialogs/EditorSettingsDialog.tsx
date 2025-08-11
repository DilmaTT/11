import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRangeContext, EditorSettings } from "@/contexts/RangeContext";

interface EditorSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  isMobileMode: boolean;
}

export const EditorSettingsDialog = ({ isOpen, onOpenChange, isMobileMode }: EditorSettingsDialogProps) => {
  const { editorSettings, setEditorSettings } = useRangeContext();

  const handleUpdateSettings = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setEditorSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateFontSetting = <K extends keyof EditorSettings['font']>(key: K, value: EditorSettings['font'][K]) => {
    setEditorSettings(prev => ({
      ...prev,
      font: { ...prev.font, [key]: value },
    }));
  };

  const handleUpdateCustomFontSize = (value: string) => {
    setEditorSettings(prev => ({
      ...prev,
      font: { ...prev.font, customSize: value },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[90dvh] overflow-y-auto sm:max-w-sm", isMobileMode && "h-full max-h-full")} mobileFullscreen={isMobileMode}>
        <DialogHeader>
          <DialogTitle>Настройки редактора</DialogTitle>
          <DialogDescription>
            Настройте внешний вид редактора диапазонов.
          </DialogDescription>
        </DialogHeader>
        <div className="py-0 space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
          {/* Matrix Background */}
          <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
            <h3 className="text-lg font-medium">Фон за матрицей</h3>
            <RadioGroup
              value={editorSettings.matrixBackgroundColor.type}
              onValueChange={(type: 'dark' | 'white' | 'custom') => 
                setEditorSettings(prev => ({ ...prev, matrixBackgroundColor: { ...prev.matrixBackgroundColor, type } }))
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="dark" id="bg-dark" /><Label htmlFor="bg-dark">Темный</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="white" id="bg-white" /><Label htmlFor="bg-white">Белый</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="bg-custom" /><Label htmlFor="bg-custom">На выбор</Label></div>
            </RadioGroup>
            {editorSettings.matrixBackgroundColor.type === 'custom' && (
              <div className="flex items-center gap-4 pl-6 pt-0.5"> {/* Changed pt-1.5 to pt-0.5 */}
                <Label htmlFor="custom-bg-color-picker" className="sr-only">Выбор цвета</Label>
                <Input id="custom-bg-color-picker" type="color" className="p-0 h-10 w-10 cursor-pointer rounded-md border-none"
                  value={editorSettings.matrixBackgroundColor.customColor}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, matrixBackgroundColor: { ...prev.matrixBackgroundColor, customColor: e.target.value } }))}
                />
                <span className="text-sm text-muted-foreground">Выберите свой цвет фона.</span>
              </div>
            )}
          </div>

          {/* Cell Background */}
          <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
            <h3 className="text-lg font-medium">Фон ячеек матрицы</h3>
            <RadioGroup
              value={editorSettings.cellBackgroundColor.type}
              onValueChange={(type: 'default' | 'white' | 'custom') => 
                setEditorSettings(prev => ({ ...prev, cellBackgroundColor: { ...prev.cellBackgroundColor, type } }))
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="default" id="color-default" /><Label htmlFor="color-default">Темный</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="white" id="color-white" /><Label htmlFor="color-white">Белый</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="color-custom" /><Label htmlFor="color-custom">На выбор</Label></div>
            </RadioGroup>
            {editorSettings.cellBackgroundColor.type === 'custom' && (
              <div className="flex items-center gap-4 pl-6 pt-0.5"> {/* Changed pt-1.5 to pt-0.5 */}
                <Label htmlFor="custom-color-picker" className="sr-only">Выбор цвета</Label>
                <Input id="custom-color-picker" type="color" className="p-0 h-10 w-10 cursor-pointer rounded-md border-none"
                  value={editorSettings.cellBackgroundColor.customColor}
                  onChange={(e) => setEditorSettings(prev => ({ ...prev, cellBackgroundColor: { ...prev.cellBackgroundColor, customColor: e.target.value } }))}
                />
                <span className="text-sm text-muted-foreground">Выберите свой цвет фона.</span>
              </div>
            )}
          </div>

          {/* Cell Border Radius */}
          <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
            <h3 className="text-lg font-medium">Скругление ячеек</h3>
            <RadioGroup
              value={editorSettings.cellBorderRadius}
              onValueChange={(radius: EditorSettings['cellBorderRadius']) => handleUpdateSettings('cellBorderRadius', radius)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="radius-none" /><Label htmlFor="radius-none">Нет</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="sm" id="radius-sm" /><Label htmlFor="radius-sm">S</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="md" id="radius-md" /><Label htmlFor="radius-md">M</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="lg" id="radius-lg" /><Label htmlFor="radius-lg">L</Label></div>
            </RadioGroup>
          </div>

          {/* Cell Spacing */}
          <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
            <h3 className="text-lg font-medium">Расстояние между ячейками</h3>
            <RadioGroup
              value={editorSettings.cellSpacing}
              onValueChange={(spacing: EditorSettings['cellSpacing']) => handleUpdateSettings('cellSpacing', spacing)}
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="spacing-none" /><Label htmlFor="spacing-none">0</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="sm" id="spacing-sm" /><Label htmlFor="spacing-sm">S</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="md" id="spacing-md" /><Label htmlFor="spacing-md">M</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="lg" id="spacing-lg" /><Label htmlFor="spacing-lg">L</Label></div>
            </RadioGroup>
          </div>

          {/* Font Settings */}
          <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
            <h3 className="text-lg font-medium">Шрифт ячеек</h3>
            <div className="space-y-1.5"> {/* Changed space-y-3 to space-y-1.5 */}
              <Label>Размер</Label>
              <RadioGroup value={editorSettings.font.size} onValueChange={(size: EditorSettings['font']['size']) => handleUpdateFontSetting('size', size)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="s" id="font-s" /><Label htmlFor="font-s">S</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="m" id="font-m" /><Label htmlFor="font-m">M</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="l" id="font-l" /><Label htmlFor="font-l">L</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="xl" id="font-xl" /><Label htmlFor="font-xl">XL</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="font-custom" /><Label htmlFor="font-custom">Свой</Label></div>
              </RadioGroup>
              {editorSettings.font.size === 'custom' && (
                <div className="flex items-center gap-4 pl-6 pt-0.5"> {/* Changed pt-1.5 to pt-0.5 */}
                  <Label htmlFor="custom-font-size-input" className="sr-only">Введите размер шрифта</Label>
                  <Input id="custom-font-size-input" type="text" className="w-24"
                    value={editorSettings.font.customSize}
                    onChange={(e) => handleUpdateCustomFontSize(e.target.value)}
                    placeholder="Например, 16px"
                  />
                  <span className="text-sm text-muted-foreground">Введите свой размер (например, 14px, 1em).</span>
                </div>
              )}
            </div>
            <div className="space-y-0.5"> {/* Changed space-y-1.5 to space-y-0.5 */}
              <Label>Цвет</Label>
              <RadioGroup value={editorSettings.font.color} onValueChange={(color: EditorSettings['font']['color']) => handleUpdateFontSetting('color', color)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="auto" id="color-auto" /><Label htmlFor="color-auto">Авто</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="white" id="color-white-font" /><Label htmlFor="color-white-font">Белый</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="black" id="color-black-font" /><Label htmlFor="color-black-font">Черный</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-0.5"> {/* Changed space-y-1.5 to space-y-0.5 */}
              <Label>Насыщенность</Label>
              <RadioGroup value={editorSettings.font.weight} onValueChange={(weight: EditorSettings['font']['weight']) => handleUpdateFontSetting('weight', weight)}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2"><RadioGroupItem value="normal" id="weight-normal" /><Label htmlFor="weight-normal">Обычный</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="bold" id="weight-bold" /><Label htmlFor="weight-bold">Жирный</Label></div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter className={cn(isMobileMode ? "justify-end" : "justify-center sm:justify-center")}>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
