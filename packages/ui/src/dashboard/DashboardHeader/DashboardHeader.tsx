import { Gift, LogOut } from "lucide-react";
import { Avatar } from "../../common/Avatar";

interface DashboardHeaderProps {
  userName: string;
  onLogout: () => void;
}

export function DashboardHeader({ userName, onLogout }: DashboardHeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#C4797A]" />
          <span className="font-heading font-semibold text-foreground">
            Wishpool
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={userName} size="sm" />
          <span className="text-sm text-foreground hidden sm:block">
            {userName}
          </span>
          <button
            onClick={onLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
