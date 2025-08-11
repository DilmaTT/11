import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { Settings, Download, Upload, Menu, LogOut } from "lucide-react";
import { importUserSettings, exportUserSettings } from "@/lib/data-manager";

// Simplified UserMenu component
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

  // If user is not authenticated, show login button
  if (!isAuthenticated) {
    return (
      <>
        <Button
          variant="outline"
          size={isMobileMode ? "icon" : "sm"}
          onClick={() => setAuthDialogOpen(true)}
          className={isMobileMode ? "p-0" : ""}
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

  // If user is authenticated
  const userInitial = user?.username?.charAt(0).toUpperCase() || "?";

  // Mobile view menu
  if (isMobileMode) {
    return (
      <>
        <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="h-4 w-4" />
        </Button>
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent mobileFullscreen>
            <DialogHeader>
              <DialogTitle>Меню</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" onClick={importUserSettings}>
                <Upload className="mr-2 h-4 w-4" />
                Импорт настроек
              </Button>
              <Button variant="outline" onClick={exportUserSettings}>
                <Download className="mr-2 h-4 w-4" />
                Экспорт настроек
              </Button>
              <Button variant="destructive" onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop view dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
          </Avatar>
          {user?.username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={importUserSettings}>
          <Upload className="mr-2 h-4 w-4" />
          <span>Импорт настроек</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportUserSettings}>
          <Download className="mr-2 h-4 w-4" />
          <span>Экспорт настроек</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
