const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ビルドディレクトリをクリーンアップ
console.log('Cleaning up build directory...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// クライアントをビルド
console.log('Building client...');
execSync('npm run build:client', { stdio: 'inherit' });

// サーバーのビルド
console.log('Building server...');
execSync('npm run build:server', { stdio: 'inherit' });

// 必要なファイルをコピー
console.log('Copying necessary files...');
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// package.jsonをコピーして修正
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  start: 'NODE_ENV=production node server/index.js'
};
// 必要ない依存関係を削除して、package.jsonを軽量化
delete packageJson.devDependencies;
fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));

// ビルド完了
console.log('Build completed successfully!');