import { useLocation, Link } from "wouter";
import { 
  HomeIcon, 
  ServerIcon, 
  ClipboardListIcon, 
  Terminal,
  CogIcon,
  UserIcon 
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  // Navigation items
  const navItems = [
    { 
      path: "/", 
      label: "ダッシュボード", 
      icon: <HomeIcon className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/rules", 
      label: "ルール設定", 
      icon: <ServerIcon className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/logs", 
      label: "モデレーションログ", 
      icon: <ClipboardListIcon className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/commands", 
      label: "コマンド一覧", 
      icon: <Terminal className="h-5 w-5 mr-3" /> 
    },
    { 
      path: "/settings", 
      label: "設定", 
      icon: <CogIcon className="h-5 w-5 mr-3" /> 
    }
  ];

  // Helper function to determine if a nav link is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="bg-discord-sidebar w-full md:w-64 md:min-h-screen flex-shrink-0">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-discord-blurple rounded-full flex items-center justify-center text-white font-bold">
            M
          </div>
          <h1 className="text-white text-lg font-semibold">言論統制Bot</h1>
        </div>

        <nav>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={`flex items-center p-2 rounded ${
                      isActive(item.path) 
                        ? "bg-discord-blurple text-white" 
                        : "hover:bg-discord-dark"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              <UserIcon className="h-6 w-6 text-gray-300" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green rounded-full border-2 border-discord-sidebar"></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">モデレーターさん</p>
            <p className="text-xs text-gray-400">オンライン</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
