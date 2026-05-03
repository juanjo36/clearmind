'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Note {
  id: string
  title: string
  content: string
  createdAt: Date
}

interface NotesTabProps {
  notes?: Note[]
  onNotesSaved?: (notes: Note[]) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// NotesTab Component
// ─────────────────────────────────────────────────────────────────────────────

export function NotesTab({ notes: initialNotes, onNotesSaved }: NotesTabProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load notes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clearmind-notes')
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
        }))
        setNotes(parsed)
      } catch (error) {
        console.error('[v0] Failed to parse stored notes:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save notes to localStorage whenever they change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('clearmind-notes', JSON.stringify(notes))
      onNotesSaved?.(notes)
    }
  }, [notes, isHydrated, onNotesSaved])

  // Filter notes by search query
  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Open modal for new note
  const handleAddNew = () => {
    setEditingNote(null)
    setFormTitle('')
    setFormContent('')
    setIsModalOpen(true)
  }

  // Open modal for editing existing note
  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormTitle(note.title)
    setFormContent(note.content)
    setIsModalOpen(true)
  }

  // Save new or edited note
  const handleSave = () => {
    if (!formTitle.trim()) {
      alert('Please enter a title')
      return
    }

    if (editingNote) {
      // Update existing note
      setNotes(
        notes.map((note) =>
          note.id === editingNote.id
            ? {
                ...note,
                title: formTitle.trim(),
                content: formContent.trim(),
              }
            : note
        )
      )
    } else {
      // Create new note
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: formTitle.trim(),
        content: formContent.trim(),
        createdAt: new Date(),
      }
      setNotes([newNote, ...notes])
    }

    setIsModalOpen(false)
    setFormTitle('')
    setFormContent('')
    setEditingNote(null)
  }

  // Delete a note
  const handleDelete = (id: string) => {
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter((note) => note.id !== id))
    }
  }

  // Close modal without saving
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNote(null)
    setFormTitle('')
    setFormContent('')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:items-center md:justify-between md:flex-row">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Notes
            </h1>
            <p className="text-sm text-muted-foreground">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
            <AlertCircle className="mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="text-base font-medium text-foreground">
              {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {notes.length === 0
                ? 'Create your first note to get started'
                : 'Try adjusting your search query'}
            </p>
            {notes.length === 0 && (
              <button
                onClick={handleAddNew}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <EditNoteModal
          note={editingNote}
          title={formTitle}
          content={formContent}
          onTitleChange={setFormTitle}
          onContentChange={setFormContent}
          onSave={handleSave}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteCard Component
// ─────────────────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const preview =
    note.content.length > 100
      ? note.content.substring(0, 100) + '...'
      : note.content

  const formattedDate = new Date(note.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm">
      {/* Title */}
      <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
        {note.title}
      </h3>

      {/* Content Preview */}
      <p className="mt-2 flex-1 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
        {preview || <span className="italic">No content</span>}
      </p>

      {/* Date */}
      <p className="mt-3 text-xs text-muted-foreground">{formattedDate}</p>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
        <button
          onClick={() => onEdit(note)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 active:bg-secondary"
        >
          <Edit2 className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border/50 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:bg-destructive/20"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EditNoteModal Component
// ─────────────────────────────────────────────────────────────────────────────

interface EditNoteModalProps {
  note: Note | null
  title: string
  content: string
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onSave: () => void
  onClose: () => void
}

function EditNoteModal({
  note,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onClose,
}: EditNoteModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-border bg-card p-6 shadow-lg md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {note ? 'Edit Note' : 'Create Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Title Input */}
          <div>
            <label
              htmlFor="note-title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Note title..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Content Input */}
          <div>
            <label
              htmlFor="note-content"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Content
            </label>
            <textarea
              id="note-content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Write your note here..."
              rows={8}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {content.length} characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted active:bg-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
          >
            <Save className="h-4 w-4" />
            <span>Save Note</span>
          </button>
        </div>
      </div>
    </>
  )
}
