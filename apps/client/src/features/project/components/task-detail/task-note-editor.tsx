import '@/features/editor/styles/index.css';
import { useEditor, EditorContent } from '@tiptap/react';
import { mainExtensions } from '@/features/editor/extensions/extensions';
import { useUpdateTaskNoteMutation } from '@/features/project/queries/project-query';
import { useDebouncedCallback } from '@mantine/hooks';
import { useEffect } from 'react';
import classes from './task-note-editor.module.css';

interface TaskNoteEditorProps {
  taskId: string;
  initialContent: Record<string, unknown> | null;
  editable?: boolean;
}

export function TaskNoteEditor({ taskId, initialContent, editable = true }: TaskNoteEditorProps) {
  const updateNote = useUpdateTaskNoteMutation();

  const saveContent = useDebouncedCallback(
    (content: Record<string, unknown>) => {
      updateNote.mutate({ taskId, data: { content } });
    },
    1500,
  );

  const editor = useEditor({
    extensions: mainExtensions,
    content: initialContent ?? undefined,
    editable,
    onUpdate: ({ editor }) => {
      saveContent(editor.getJSON() as Record<string, unknown>);
    },
  });

  // Re-initialize when task changes
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(initialContent ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return (
    <div className={classes.editorWrapper}>
      <EditorContent editor={editor} />
    </div>
  );
}
