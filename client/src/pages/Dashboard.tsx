import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import StatsCard from "@/components/StatsCard";
import CommandCard from "@/components/CommandCard";
import { AlertCircle, Check, MessageCircle, Trash2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Rule, ModerationLog, Stats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: rules, isLoading: rulesLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs?limit=3"],
  });

  const { data: botStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  function formatTimeDifference(timestamp: Date): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "たった今";
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}時間前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}日前`;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">言論統制Bot - ダッシュボード</h1>
          <p className="text-discord-light">Discordサーバーの自動モデレーションを管理します</p>
        </div>
        
        {/* Status Card */}
        {statusLoading ? (
          <Skeleton className="h-16 w-52 mt-4 md:mt-0" />
        ) : (
          <div className="mt-4 md:mt-0 bg-discord-darker rounded-lg p-4 flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 ${botStatus?.online ? 'bg-discord-green' : 'bg-discord-red'} rounded-full`}></div>
            </div>
            <div>
              <p className="text-white font-medium">
                Bot ステータス: {botStatus?.online ? 'オンライン' : 'オフライン'}
              </p>
              <p className="text-xs text-discord-light">
                最終更新: {botStatus?.lastUpdated ? formatTimeDifference(new Date(botStatus.lastUpdated)) : '不明'}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatsCard
              title="監視メッセージ数"
              value={stats?.messagesMonitored.toLocaleString() || "0"}
              icon={<MessageCircle />}
              change="+12% 先週比"
              iconBgColor="bg-discord-blurple"
              iconColor="text-discord-blurple"
            />
            <StatsCard
              title="削除メッセージ数"
              value={stats?.messagesDeleted.toLocaleString() || "0"}
              icon={<Trash2 />}
              change="+5% 先週比"
              iconBgColor="bg-discord-red"
              iconColor="text-discord-red"
            />
            <StatsCard
              title="警告発行数"
              value={stats?.warningsIssued.toLocaleString() || "0"}
              icon={<AlertTriangle />}
              change="+3% 先週比"
              changeColor="text-discord-yellow"
              iconBgColor="bg-discord-yellow"
              iconColor="text-discord-yellow"
            />
          </>
        )}
      </div>

      {/* Moderation Rules */}
      <div className="bg-discord-darker rounded-lg overflow-hidden">
        <div className="p-4 bg-discord-darker border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">有効なルール</h2>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">ルール名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">キーワード</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">アクション</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">状態</th>
                </tr>
              </thead>
              <tbody>
                {rulesLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ) : rules && rules.length > 0 ? (
                  rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-white">{rule.name}</td>
                      <td className="px-4 py-3 text-sm text-discord-light">{rule.keywords}</td>
                      <td className="px-4 py-3 text-sm text-discord-light">{rule.action}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 ${rule.enabled ? 'bg-discord-green bg-opacity-20 text-discord-green' : 'bg-gray-700 text-gray-400'} rounded-full text-xs`}>
                          {rule.enabled ? '有効' : '無効'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-discord-light">
                      ルールが設定されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <Link href="/rules">
              <Button className="bg-discord-blurple hover:bg-opacity-80">
                ルールの追加
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Mod Actions */}
      <div className="bg-discord-darker rounded-lg overflow-hidden">
        <div className="p-4 bg-discord-darker border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">最近のモデレーション</h2>
          <Link href="/logs">
            <a className="text-discord-blurple text-sm hover:underline">すべて表示</a>
          </Link>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">時間</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">ユーザー</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">アクション</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-discord-light uppercase tracking-wider">理由</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-3">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-discord-light">
                        {formatTimeDifference(new Date(log.timestamp))}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-600 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <AlertCircle className="h-5 w-5 text-gray-300" />
                          </div>
                          <span className="text-white">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 ${
                          log.action.includes('削除') 
                            ? 'bg-discord-red bg-opacity-20 text-discord-red' 
                            : log.action.includes('警告') 
                              ? 'bg-discord-yellow bg-opacity-20 text-discord-yellow'
                              : 'bg-discord-blurple bg-opacity-20 text-discord-blurple'
                        } rounded-full text-xs`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-discord-light">{log.reason}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-discord-light">
                      モデレーションログはありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bot Commands */}
      <div className="bg-discord-darker rounded-lg overflow-hidden">
        <div className="p-4 bg-discord-darker border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">コマンド一覧</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/commands">
              <a className="block w-full">
                <CommandCard
                  name="!help"
                  description="利用可能なコマンドの一覧を表示します"
                  icon={<AlertCircle />}
                  bgColor="bg-discord-blurple"
                  iconColor="text-discord-blurple"
                />
              </a>
            </Link>
            
            <Link href="/commands">
              <a className="block w-full">
                <CommandCard
                  name="!delete [数]"
                  description="指定した数のメッセージを削除します"
                  icon={<Trash2 />}
                  bgColor="bg-discord-red"
                  iconColor="text-discord-red"
                />
              </a>
            </Link>
            
            <Link href="/commands">
              <a className="block w-full">
                <CommandCard
                  name="!warn [@ユーザー] [理由]"
                  description="指定したユーザーに警告を送信します"
                  icon={<AlertTriangle />}
                  bgColor="bg-discord-yellow"
                  iconColor="text-discord-yellow"
                />
              </a>
            </Link>
            
            <Link href="/commands">
              <a className="block w-full">
                <CommandCard
                  name="!rule [add/remove/list]"
                  description="モデレーションルールを管理します"
                  icon={<Check />}
                  bgColor="bg-discord-blurple"
                  iconColor="text-discord-blurple"
                />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
