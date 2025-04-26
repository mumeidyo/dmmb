import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, Plus } from "lucide-react";
import { insertRuleSchema, Rule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

// Create the rule schema with additional validation
const formSchema = insertRuleSchema.extend({
  name: z.string().min(1, "ルール名は必須です"),
  keywords: z.string().min(1, "キーワードは必須です"),
  action: z.string().min(1, "アクションは必須です"),
  enabled: z.boolean(),
});

export default function Rules() {
  const { data: rules, isLoading } = useQuery<Rule[]>({
    queryKey: ["/api/rules"],
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const { toast } = useToast();

  // Form for adding a new rule
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      keywords: "",
      action: "",
      enabled: true,
    },
  });

  // Form for editing an existing rule
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      keywords: "",
      action: "",
      enabled: true,
    },
  });

  // Reset form when dialog closes
  const onAddDialogOpenChange = (open: boolean) => {
    if (!open) {
      addForm.reset();
    }
    setIsAddDialogOpen(open);
  };

  const onEditDialogOpenChange = (open: boolean) => {
    if (!open) {
      editForm.reset();
      setEditingRule(null);
    }
    setIsEditDialogOpen(open);
  };

  // Add rule mutation
  const addMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/rules", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ルール追加",
        description: "新しいルールが追加されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `ルールの追加に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Edit rule mutation
  const editMutation = useMutation({
    mutationFn: async (data: { id: number; rule: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PATCH", `/api/rules/${data.id}`, data.rule);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "ルール更新",
        description: "ルールが更新されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      setIsEditDialogOpen(false);
      setEditingRule(null);
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `ルールの更新に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete rule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "ルール削除",
        description: "ルールが削除されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `ルールの削除に失敗しました: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle adding a new rule
  const onAddSubmit = (data: z.infer<typeof formSchema>) => {
    addMutation.mutate(data);
  };

  // Handle editing a rule
  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingRule) {
      editMutation.mutate({ id: editingRule.id, rule: data });
    }
  };

  // Open edit dialog with rule data
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    editForm.reset({
      name: rule.name,
      keywords: rule.keywords,
      action: rule.action,
      enabled: rule.enabled,
    });
    setIsEditDialogOpen(true);
  };

  // Confirm and delete a rule
  const handleDelete = (id: number) => {
    if (window.confirm("このルールを削除してもよろしいですか？")) {
      deleteMutation.mutate(id);
    }
  };

  // Toggle rule enabled status
  const toggleRuleStatus = (rule: Rule) => {
    editMutation.mutate({
      id: rule.id,
      rule: { enabled: !rule.enabled },
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">ルール設定</h1>
          <p className="text-discord-light">モデレーションルールの管理</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={onAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-discord-blurple hover:bg-opacity-80 mt-4 md:mt-0">
              <Plus className="mr-2 h-4 w-4" />
              新しいルールを追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新しいルールを追加</DialogTitle>
              <DialogDescription>
                キーワードやアクションを含む新しいモデレーションルールを作成します。
              </DialogDescription>
            </DialogHeader>

            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ルール名</FormLabel>
                      <FormControl>
                        <Input placeholder="不適切な言葉" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>キーワード</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="キーワード1,キーワード2,キーワード3" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        カンマで区切って複数のキーワードを入力できます。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>アクション</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="メッセージ削除 + 警告" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        例: メッセージ削除, 警告, ミュート（10分）
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>有効</FormLabel>
                        <FormDescription>
                          このルールをすぐに有効にします
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="bg-discord-blurple hover:bg-opacity-80"
                    disabled={addMutation.isPending}
                  >
                    {addMutation.isPending ? "追加中..." : "ルールを追加"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rules && rules.length > 0 ? (
          rules.map((rule) => (
            <Card key={rule.id} className="bg-discord-darker border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-white">{rule.name}</CardTitle>
                  <CardDescription>ID: {rule.id}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={rule.enabled} 
                    onCheckedChange={() => toggleRuleStatus(rule)}
                    className={rule.enabled ? "bg-discord-green" : ""}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleEdit(rule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-discord-red" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-discord-light mb-1">キーワード</h3>
                    <p className="text-white">{rule.keywords}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-discord-light mb-1">アクション</h3>
                    <p className="text-white">{rule.action}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-discord-light mb-1">状態</h3>
                  <span className={`px-2 py-1 ${
                    rule.enabled 
                      ? 'bg-discord-green bg-opacity-20 text-discord-green' 
                      : 'bg-gray-700 text-gray-400'
                  } rounded-full text-xs`}>
                    {rule.enabled ? '有効' : '無効'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-discord-darker border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center py-6">
                <p className="text-discord-light">ルールが設定されていません</p>
                <Button 
                  className="bg-discord-blurple hover:bg-opacity-80 mt-4"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  最初のルールを追加
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={onEditDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ルールを編集</DialogTitle>
            <DialogDescription>
              モデレーションルールの詳細を更新します。
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ルール名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>キーワード</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      カンマで区切って複数のキーワードを入力できます。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>アクション</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      例: メッセージ削除, 警告, ミュート（10分）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>有効</FormLabel>
                      <FormDescription>
                        このルールを有効にします
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-discord-blurple hover:bg-opacity-80"
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? "更新中..." : "ルールを更新"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
