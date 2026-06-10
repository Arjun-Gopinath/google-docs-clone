import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EditorToolbar from '../components/EditorToolbar';

function makeEditor(activeFormats = {}) {
  const chain = () => ({
    focus: () => ({
      toggleBold: () => ({ run: vi.fn() }),
      toggleItalic: () => ({ run: vi.fn() }),
      toggleUnderline: () => ({ run: vi.fn() }),
      toggleHeading: () => ({ run: vi.fn() }),
      toggleBulletList: () => ({ run: vi.fn() }),
      toggleOrderedList: () => ({ run: vi.fn() }),
    }),
  });

  return {
    chain,
    isActive: (type, attrs) => {
      if (attrs) return activeFormats[`${type}-${attrs.level}`] || false;
      return activeFormats[type] || false;
    },
  };
}

describe('EditorToolbar', () => {
  it('renders all formatting buttons', () => {
    render(<EditorToolbar editor={makeEditor()} />);
    expect(screen.getByTitle('Bold')).toBeInTheDocument();
    expect(screen.getByTitle('Italic')).toBeInTheDocument();
    expect(screen.getByTitle('Underline')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 1')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 2')).toBeInTheDocument();
    expect(screen.getByTitle('Heading 3')).toBeInTheDocument();
    expect(screen.getByTitle('Bullet list')).toBeInTheDocument();
    expect(screen.getByTitle('Numbered list')).toBeInTheDocument();
  });

  it('marks active button with aria-pressed=true', () => {
    render(<EditorToolbar editor={makeEditor({ bold: true })} />);
    expect(screen.getByTitle('Bold')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTitle('Italic')).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders nothing when editor is null', () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls chain().focus().toggleBold().run() on Bold click', () => {
    const run = vi.fn();
    const editor = {
      chain: () => ({ focus: () => ({ toggleBold: () => ({ run }) }) }),
      isActive: () => false,
    };
    render(<EditorToolbar editor={editor} />);
    fireEvent.mouseDown(screen.getByTitle('Bold'));
    expect(run).toHaveBeenCalled();
  });
});
