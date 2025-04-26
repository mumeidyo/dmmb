import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Search, Trash2, AlertTriangle, Clock } from "lucide-react";
import { ModerationLog } from "@shared/schema";

export default function Logs() {
  const { data: logs, isLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs"],
  });

  const [searchTerm, setSearchTerm] = useState("");

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

  function formatDateTime(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Filter logs based on search term
  const filteredLogs = logs
    ? logs.filter(
        (log) =>
          log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.messageContent && log.messageContent.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">モデレーションログ</h1>
          <p className="text-discord-light">Botのモデレーション履歴</p>
        </div>
      </header>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="ユーザー名、アクション、理由で検索..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="ghost" 
              className="ml-2"
              onClick={() => setSearchTerm("")}
              disabled={!searchTerm}
            >
              クリア
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white">モデレーションログ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : logs && logs.length > 0 ? (
            <div className="rounded-md border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-transparent">
                    <TableHead className="text-discord-light">時間</TableHead>
                    <TableHead className="text-discord-light">ユーザー</TableHead>
                    <TableHead className="text-discord-light">アクション</TableHead>
                    <TableHead className="text-discord-light">理由</TableHead>
                    <TableHead className="text-discord-light">メッセージ内容</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700">
                      <TableCell className="text-discord-light">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <div>{formatTimeDifference(new Date(log.timestamp))}</div>
                            <div className="text-xs text-gray-500">{formatDateTime(new Date(log.timestamp))}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-600 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                            <AlertCircle className="h-5 w-5 text-gray-300" />
                          </div>
                          <span className="text-white">{log.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 ${
                          log.action.includes('削除') 
                            ? 'bg-discord-red bg-opacity-20 text-discord-red' 
                            : log.action.includes('警告') 
                              ? 'bg-discord-yellow bg-opacity-20 text-discord-yellow'
                              : 'bg-discord-blurple bg-opacity-20 text-discord-blurple'
                        } rounded-full text-xs`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-discord-light">{log.reason}</TableCell>
                      <TableCell className="text-discord-light truncate max-w-xs">
                        {log.messageContent || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-gray-500" />
              </div>
              <p className="text-discord-light">モデレーションログがありません</p>
            </div>
          )}

          {logs && logs.length > 0 && filteredLogs.length === 0 && (
            <div className="text-center py-10">
              <div className="flex justify-center mb-4">
                <Search className="h-12 w-12 text-gray-500" />
              </div>
              <p className="text-discord-light">検索結果がありません</p>
              <Button 
                variant="link" 
                className="text-discord-blurple"
                onClick={() => setSearchTerm("")}
              >
                検索をクリア
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
