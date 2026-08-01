import Link from "next/link";
import { LayoutDashboard, Wallet, Tags, ArrowRightLeft, LogOut } from "lucide-react";

export function Sidebar() {
  const menus = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Contas", href: "/accounts", icon: Wallet },
    { name: "Categorias", href: "/categories", icon: Tags },
    { name: "Transações", href: "/transactions", icon: ArrowRightLeft },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Wallet className="w-8 h-8" />
          Finance<span className="text-foreground">SaaS</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 mt-6 space-y-2">
        {menus.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
