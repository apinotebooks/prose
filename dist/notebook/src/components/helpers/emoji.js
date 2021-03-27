import emoji from 'markdown-it-emoji';
export function hookMarkdownItToEmojiPlugin(markdownItInstance, withShortcuts = false) {
    markdownItInstance.use(emoji, { shortcuts: withShortcuts ? undefined : {} });
}
//# sourceMappingURL=emoji.js.map