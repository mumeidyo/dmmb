import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CommandCard from "@/components/CommandCard";
import { 
  HelpCircle, 
  Trash2, 
  AlertTriangle, 
  Settings, 
  Shield, 
  User, 
  Megaphone,
  Ban,
  Clock
} from "lucide-react";

export default function Commands() {
  // Command groups
  const basicCommands = [
    {
      name: "!help",
      description: "利用可能なコマンドの一覧を表示します",
      icon: <HelpCircle />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    }
  ];

  const moderationCommands = [
    {
      name: "!delete [数]",
      description: "指定した数のメッセージを削除します",
      icon: <Trash2 />,
      bgColor: "bg-discord-red",
      iconColor: "text-discord-red"
    },
    {
      name: "!warn [@ユーザー] [理由]",
      description: "指定したユーザーに警告を送信します",
      icon: <AlertTriangle />,
      bgColor: "bg-discord-yellow",
      iconColor: "text-discord-yellow"
    },
    {
      name: "!mute [@ユーザー] [時間] [理由]",
      description: "指定したユーザーを一時的にミュートします",
      icon: <Megaphone />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    },
    {
      name: "!ban [@ユーザー] [理由]",
      description: "指定したユーザーをBANします",
      icon: <Ban />,
      bgColor: "bg-discord-red",
      iconColor: "text-discord-red"
    }
  ];

  const ruleCommands = [
    {
      name: "!rule list",
      description: "現在のモデレーションルールを一覧表示します",
      icon: <Shield />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    },
    {
      name: "!rule add [名前] [キーワード] [アクション]",
      description: "新しいルールを追加します",
      icon: <Shield />,
      bgColor: "bg-discord-green",
      iconColor: "text-discord-green"
    },
    {
      name: "!rule remove [ID]",
      description: "IDを指定してルールを削除します",
      icon: <Shield />,
      bgColor: "bg-discord-red",
      iconColor: "text-discord-red"
    }
  ];

  const utilityCommands = [
    {
      name: "!userinfo [@ユーザー]",
      description: "ユーザー情報を表示します",
      icon: <User />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    },
    {
      name: "!stats",
      description: "Botの統計情報を表示します",
      icon: <Clock />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    },
    {
      name: "!settings [設定名] [値]",
      description: "Botの設定を変更します",
      icon: <Settings />,
      bgColor: "bg-discord-blurple",
      iconColor: "text-discord-blurple"
    }
  ];

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">コマンド一覧</h1>
        <p className="text-discord-light">利用可能なBot コマンドの一覧です</p>
      </header>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">基本コマンド</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicCommands.map((command) => (
              <CommandCard
                key={command.name}
                name={command.name}
                description={command.description}
                icon={command.icon}
                bgColor={command.bgColor}
                iconColor={command.iconColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">モデレーションコマンド</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderationCommands.map((command) => (
              <CommandCard
                key={command.name}
                name={command.name}
                description={command.description}
                icon={command.icon}
                bgColor={command.bgColor}
                iconColor={command.iconColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">ルール管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ruleCommands.map((command) => (
              <CommandCard
                key={command.name}
                name={command.name}
                description={command.description}
                icon={command.icon}
                bgColor={command.bgColor}
                iconColor={command.iconColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">ユーティリティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {utilityCommands.map((command) => (
              <CommandCard
                key={command.name}
                name={command.name}
                description={command.description}
                icon={command.icon}
                bgColor={command.bgColor}
                iconColor={command.iconColor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-discord-darker border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Botの使い方</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-discord-light">
            <p>
              Discordサーバー内でコマンドを使用するには、適切な権限が必要です。
              多くのコマンドはモデレーターやサーバー管理者のみが使用できます。
            </p>
            
            <h3 className="text-white font-medium mt-4">コマンドの例:</h3>
            <pre className="bg-gray-800 p-3 rounded-md overflow-x-auto">
              !warn @ユーザー スパム送信
            </pre>
            <pre className="bg-gray-800 p-3 rounded-md overflow-x-auto">
              !delete 10
            </pre>
            <pre className="bg-gray-800 p-3 rounded-md overflow-x-auto">
              !rule add "スパム防止" "同一メッセージ,繰り返し" "メッセージ削除 + 警告"
            </pre>
            
            <p className="mt-4">
              詳細については <code>!help</code> コマンドを使用してください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
