import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Shield, Bot, Server, Webhook, Key } from "lucide-react";

// Settings schema
const settingsSchema = z.object({
  token: z.string().min(1, "Botトークンは必須です"),
  prefix: z.string().min(1, "コマンドプレフィックスは必須です"),
  status: z.enum(["online", "idle", "dnd"], {
    required_error: "Botステータスを選択してください",
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  // Setup form with default values from the server
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      token: "",
      prefix: "!",
      status: "online",
    },
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        token: settings.token || "",
        prefix: settings.prefix || "!",
        status: settings.status || "online",
      });
    }
  }, [settings, form]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      const response = await apiRequest("PATCH", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "設定を更新しました",
        description: "Botの設定が正常に更新されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `設定の更新に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  // Helper function to mask token
  const maskToken = (token: string) => {
    if (!token) return "";
    if (token.length <= 10) return token;
    return token.substring(0, 4) + "..." + token.substring(token.length - 4);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-discord-light">Discord言論統制Botの設定</p>
      </header>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-discord-darker border-gray-700">
            <CardHeader className="flex flex-row items-center gap-4">
              <Bot className="h-8 w-8 text-discord-blurple" />
              <div>
                <CardTitle className="text-white">Bot設定</CardTitle>
                <CardDescription>
                  Botの基本設定を管理します
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            <span>Botトークン</span>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input 
                              type="password" 
                              placeholder="Discord Bot Token" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Discord Developer Portalで取得したBotのトークンを入力してください
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <Webhook className="h-4 w-4" />
                            <span>コマンドプレフィックス</span>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="!" 
                            {...field}
                            maxLength={5}
                          />
                        </FormControl>
                        <FormDescription>
                          Botのコマンドの前につける記号または文字（例: !, /, $）
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            <span>Bot ステータス</span>
                          </div>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="ステータスを選択" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="online">オンライン</SelectItem>
                            <SelectItem value="idle">退席中</SelectItem>
                            <SelectItem value="dnd">取り込み中</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Discordに表示されるBotのステータス
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="bg-discord-blurple hover:bg-opacity-80 w-full"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "更新中..." : "設定を保存"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-discord-darker border-gray-700">
            <CardHeader className="flex flex-row items-center gap-4">
              <Shield className="h-8 w-8 text-discord-green" />
              <div>
                <CardTitle className="text-white">Bot情報</CardTitle>
                <CardDescription>
                  言論統制Botについての情報
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-discord-light mb-1">Botの招待方法</h3>
                <p className="text-white">
                  Botをサーバーに招待するには、Discord Developer Portalでアプリケーションを作成し、
                  OAuth2 URLを生成する必要があります。必要な権限は以下の通りです:
                </p>
                <ul className="list-disc pl-5 mt-2 text-discord-light">
                  <li>メッセージの読み取り</li>
                  <li>メッセージの送信</li>
                  <li>メッセージの管理</li>
                  <li>メンバーのタイムアウト</li>
                  <li>チャンネルの表示</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-discord-light mb-1">実装機能</h3>
                <ul className="list-disc pl-5 text-discord-light">
                  <li>キーワードベースのメッセージフィルタリング</li>
                  <li>自動モデレーション（削除、警告、ミュート）</li>
                  <li>モデレーションログ</li>
                  <li>カスタマイズ可能なルール</li>
                  <li>モデレーターコマンド</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-discord-light mb-1">サポート</h3>
                <p className="text-discord-light">
                  問題が発生した場合は、GitHubリポジトリにissueを作成するか、
                  サポートサーバーに参加してください。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
