const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = {
  theme: path.join(root, 'src', 'styles', 'theme-variables.scss'),
  feed: path.join(root, 'src', 'app', 'features', 'feed', 'components', 'feed', 'feed.component.scss'),
  chatList: path.join(root, 'src', 'app', 'features', 'chat', 'components', 'chat-list', 'chat.component.scss'),
  chatWindow: path.join(root, 'src', 'app', 'features', 'chat', 'components', 'chat-window', 'chat-window.component.scss'),
  messageBubble: path.join(root, 'src', 'app', 'features', 'chat', 'components', 'message-bubble', 'message-bubble.component.scss'),
  profileHeader: path.join(root, 'src', 'app', 'features', 'profile', 'components', 'profile-header', 'profile-header.component.scss'),
  profileContent: path.join(root, 'src', 'app', 'features', 'profile', 'components', 'profile-content', 'profile-content.component.scss'),
  app: path.join(root, 'src', 'app.component.scss'),
  home: path.join(root, 'src', 'app', 'shared', 'components', 'home', 'home.component.scss'),
};

const fix = (file, replacements) => {
  let content = fs.readFileSync(file, 'utf8');
  let updated = content;
  replacements.forEach(({search, replace, description}) => {
    updated = updated.replace(search, replace);
  });
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Patched', path.relative(root, file));
  }
};

fix(files.theme, [
  {
    search: /(--gold-rgb: 201,162,39;)/,
    replace: '$1\n  --gold-muted: rgba(var(--gold-rgb), 0.55);\n  --gold-dim: rgba(var(--gold-rgb), 0.12);\n  --text-color-rgb: 240,245,249;\n  --bg-color-rgb: 8,11,20;\n  --online-green-rgb: 34,197,94;',
  },
  {
    search: /(--gold-gradient: linear-gradient\(135deg, #a07d10, #c9a227, #e8c14a\);)/,
    replace: '$1\n  --gold-rgb: 201,162,39;\n',
  },
]);

fix(files.theme, [
  {
    search: /(body\.light-theme \{[\s\S]*?--gold-gradient: linear-gradient\(135deg, #a07d10, #c9a227, #e8c14a\);)/,
    replace: `$1\n  --gold-rgb: 201,162,39;\n  --gold-muted: rgba(var(--gold-rgb), 0.55);\n  --gold-dim: rgba(var(--gold-rgb), 0.12);\n  --text-color-rgb: 26,18,8;\n  --bg-color-rgb: 237,226,200;\n  --online-green-rgb: 34,197,94;`,
  },
]);

fix(files.feed, [
  { search: /var\(--gold\)-primary/g, replace: 'var(--gold)' },
  { search: /rgba\(var\(--gold\)-primary,\s*([0-9.]+)\)/g, replace: 'rgba(var(--gold-rgb), $1)' },
  { search: /var\(--gold\)-muted/g, replace: 'var(--gold-muted)' },
  { search: /color:\s*rgba\(var\(--text-color\),\s*0\.75\);/g, replace: 'color: rgba(var(--text-color-rgb), 0.75);' },
]);

fix(files.chatList, [
  { search: /var\(--online-green\):\s*#[0-9a-fA-F]{6};\s*\n/, replace: '' },
  { search: /rgba\(var\(--online-green\),/g, replace: 'rgba(var(--online-green-rgb),' },
]);

fix(files.chatWindow, [
  { search: /^var\(--[\w-]+\):.*\n/gm, replace: '' },
  { search: /color:\s*rgba\(var\(--bg-color\),\s*0\.55\);/g, replace: 'color: rgba(var(--text-color-rgb), 0.55);' },
  { search: /color:\s*rgba\(var\(--bg-color\),\s*0\.7\);/g, replace: 'color: rgba(var(--text-color-rgb), 0.7);' },
]);

fix(files.messageBubble, [
  { search: /^var\(--[\w-]+\):.*\n/gm, replace: '' },
  { search: /background:\s*var\(--card-bg\)-light;/g, replace: 'background: var(--card-bg-hover);' },
  { search: /color:\s*rgba\(var\(--bg-color\),\s*0\.55\);/g, replace: 'color: rgba(var(--text-color-rgb), 0.55);' },
  { search: /color:\s*rgba\(var\(--bg-color\),\s*0\.7\);/g, replace: 'color: rgba(var(--text-color-rgb), 0.7);' },
]);

fix(files.profileHeader, [
  { search: /^var\(--gold\)-dim:.*\n/gm, replace: '' },
  { search: /background: var\(--gold\)-dim;/g, replace: 'background: rgba(var(--gold-rgb), 0.12);' },
]);

fix(files.profileContent, [
  { search: /background: var\(--gold\)-dim;/g, replace: 'background: rgba(var(--gold-rgb), 0.12);' },
]);

fix(files.app, [
  { search: /background:\s*#f8fafc;/g, replace: 'background: var(--bg-color);' },
  { search: /background:\s*#0f172a;/g, replace: 'background: var(--bg-color);' },
]);

fix(files.home, [
  { search: /background:\s*linear-gradient\(to bottom, #111111 0%, #1a1a1a 100%\);/g, replace: 'background: var(--bg-color);' },
  { search: /background:\s*linear-gradient\(to bottom, #0a0a0a 0%, #111111 100%\);/g, replace: 'background: var(--bg-color);' },
]);
