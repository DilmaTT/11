import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { Settings, Download, Upload, LogOut, CloudUpload, CloudDownload } from "lucide-react";
import { importDataFromFile, exportDataToFile, syncDataToSupabase, loadDataFromSupabase, downloadCloudBackup } from "@/lib/data-manager";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  isMobileMode: boolean;
}

export const UserMenu = ({ isMobileMode }: UserMenuProps) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- UNAUTHORIZED STATE ---
  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          size={isMobileMode ? "icon" : "sm"}
          onClick={() => setAuthDialogOpen(true)}
        >
          {isMobileMode ? (
            <Settings className="h-4 w-4" />
          ) : (
            <>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">?</AvatarFallback>
              </Avatar>
              <span className="ml-2">Войти</span>
            </>
          )}
        </Button>
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  // --- AUTHORIZED STATE ---
  const userInitial = user?.email?.charAt(0).toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Mobile View (Authorized)
  if (isMobileMode) {
    return (
      <>
        <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)}>
           <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent mobileFullscreen>
            <DialogHeader>
              <DialogTitle>Меню</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-4">
              <div className="p-2 text-center text-sm text-muted-foreground border-b pb-4 mb-2">
                <p>Вы вошли как</p>
                <p className="font-semibold truncate">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={() => { syncDataToSupabase(); closeMobileMenu(); }}>
                <CloudUpload className="mr-2 h-4 w-4" />
                Сохранить в облако
              </Button>
              <Button variant="outline" onClick={() => { loadDataFromSupabase(); closeMobileMenu(); }}>
                <CloudDownload className="mr-2 h-4 w-4" />
                Загрузить из облака
              </Button>
              <hr className="my-2"/>
              <Button variant="outline" onClick={() => { importDataFromFile(); closeMobileMenu(); }}>
                <Upload className="mr-2 h-4 w-4" />
                Импорт из файла
              </Button>
              <Button variant="outline" onClick={() => { exportDataToFile(); closeMobileMenu(); }}>
                <Download className="mr-2 h-4 w-4" />
                Экспорт в файл
              </Button>
              <Button variant="outline" onClick={() => { downloadCloudBackup(); closeMobileMenu(); }}>
                <CloudDownload className="mr-2 h-4 w-4" />
                Скачать бэкап из облака
              </Button>
              <hr className="my-2"/>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop View (Authorized)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
         <div className="px-2 py-1.5 text-sm">
            <p className="font-semibold">Вы вошли как</p>
            <p className="text-muted-foreground truncate">{user?.email}</p>
         </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => syncDataToSupabase()}>
          <CloudUpload className="mr-2 h-4 w-4" />
          <span>Сохранить в облако</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => loadDataFromSupabase()}>
          <CloudDownload className="mr-2 h-4 w-4" />
          <span>Загрузить из облака</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={importDataFromFile}>
          <Upload className="mr-2 h-4 w-4" />
          <span>Импорт из файла</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportDataToFile}>
          <Download className="mr-2 h-4 w-4" />
          <span>Экспорт в файл</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadCloudBackup}>
          <CloudDownload className="mr-2 h-4 w-4" />
          <span>Скачать бэкап из облака</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
