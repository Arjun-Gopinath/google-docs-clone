import styles from './EditorToolbar.module.css';

const HEADINGS = [1, 2, 3];

export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  function btn(label, action, isActive, title) {
    return (
      <button
        key={title || label}
        className={`${styles.btn} ${isActive ? styles.active : ''}`}
        onMouseDown={(e) => { e.preventDefault(); action(); }}
        title={title || label}
        aria-pressed={isActive}
      >
        {label}
      </button>
    );
  }

  return (
    <div className={styles.toolbar} data-testid="editor-toolbar">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'Bold')}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'Italic')}
      {btn('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Underline')}

      <span className={styles.divider} />

      {HEADINGS.map((level) =>
        btn(
          `H${level}`,
          () => editor.chain().focus().toggleHeading({ level }).run(),
          editor.isActive('heading', { level }),
          `Heading ${level}`
        )
      )}

      <span className={styles.divider} />

      {btn(
        '≡',
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
        'Bullet list'
      )}
      {btn(
        '1.',
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
        'Numbered list'
      )}
    </div>
  );
}
