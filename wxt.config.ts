import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'extension-public',
  manifest: {
    name: 'Focus Resume Card',
    description: 'Save one concrete next action for interrupted work.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    action: {
      default_title: 'Open your resume card',
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },
});
