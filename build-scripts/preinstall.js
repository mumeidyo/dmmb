/**
 * Render.comデプロイ用のプリインストールスクリプト
 * 
 * package.jsonに以下を追加してください：
 * "scripts": {
 *   "preinstall": "node ./build-scripts/preinstall.js",
 *   ...
 * }
 */

// 本番環境でのみ実行
if (process.env.NODE_ENV === 'production') {
  console.log('Render.comでのデプロイを準備しています...');
  
  // npmの設定を調整して依存関係のインストール問題を回避
  process.env.npm_config_legacy_peer_deps = 'true';
  process.env.npm_config_unsafe_perm = 'true';
  process.env.npm_config_yes = 'true';
  
  console.log('npm設定を調整しました:');
  console.log('- legacy-peer-deps: true');
  console.log('- unsafe-perm: true');
  console.log('- yes: true');
} else {
  console.log('開発環境でpreinstallスクリプトをスキップしました');
}