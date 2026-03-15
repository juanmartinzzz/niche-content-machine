'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, Drawer } from '@/components/interaction'
import { Plus, Trash2, MessageCircle, AlertCircle, CheckCircle, Star, Pencil } from 'lucide-react'
import { formatHumanReadableDate } from '@/utils/time'

interface TelegramChat {
  id: string
  chat_id: string
  chat_title: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface IntegrationStatus {
  bot_configured: boolean
  bot_username?: string
}

interface TelegramClientProps {
  showHeaderButton?: boolean
}

export const TelegramClient: React.FC<TelegramClientProps> = ({ showHeaderButton = false }) => {
  const [chats, setChats] = useState<TelegramChat[]>([])
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({ bot_configured: false })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [editingChat, setEditingChat] = useState<TelegramChat | null>(null)
  const [editChatId, setEditChatId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [formData, setFormData] = useState({
    chat_id: '',
    chat_title: ''
  })

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/integrations/telegram/chats')
      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const integrations = await response.json()
        const telegramBot = integrations.find((i: any) => i.type === 'telegram_bot')
        setIntegrationStatus({
          bot_configured: !!telegramBot,
          bot_username: telegramBot?.config?.bot_username
        })
      }
    } catch (error) {
      console.error('Error fetching integration status:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchChats(), fetchIntegrationStatus()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleAddChat = async () => {
    if (!formData.chat_id.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/integrations/telegram/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: formData.chat_id.trim(),
          chat_title: formData.chat_title.trim() || null
        })
      })

      if (response.ok) {
        setFormData({ chat_id: '', chat_title: '' })
        setIsAddDrawerOpen(false)
        await fetchChats()
      } else {
        const errorData = await response.json()
        alert(`Error adding chat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error adding chat:', error)
      alert('Error adding chat. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenAddDrawer = () => {
    setFormData({ chat_id: '', chat_title: '' })
    setIsAddDrawerOpen(true)
  }

  const handleCloseAddDrawer = () => {
    setIsAddDrawerOpen(false)
    setFormData({ chat_id: '', chat_title: '' })
  }

  const handleRemoveChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to remove this chat connection?')) return

    try {
      const response = await fetch(`/api/integrations/telegram/chats/${chatId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchChats()
      } else {
        const errorData = await response.json()
        alert(`Error removing chat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error removing chat:', error)
      alert('Error removing chat. Please try again.')
    }
  }

  const handleToggleChat = async (chat: TelegramChat) => {
    try {
      const response = await fetch(`/api/integrations/telegram/chats/${chat.chat_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !chat.is_active })
      })

      if (response.ok) {
        await fetchChats()
      } else {
        const errorData = await response.json()
        alert(`Error updating chat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating chat:', error)
      alert('Error updating chat. Please try again.')
    }
  }

  const handleSetDefaultChat = async (chat: TelegramChat) => {
    if (!confirm('This will set this chat as your default for notifications. Only one chat can be default at a time. Continue?')) return

    try {
      const response = await fetch(`/api/integrations/telegram/chats/${chat.chat_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true })
      })

      if (response.ok) {
        alert('This chat has been set as your default for notifications.')
        await fetchChats()
      } else {
        const errorData = await response.json()
        alert(`Error setting default chat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error setting default chat:', error)
      alert('Error setting default chat. Please try again.')
    }
  }

  const handleStartEdit = (chat: TelegramChat) => {
    setEditingChat(chat)
    setEditChatId(chat.chat_id)
    setEditTitle(chat.chat_title || '')
    setIsEditDrawerOpen(true)
  }

  const handleCancelEdit = () => {
    setIsEditDrawerOpen(false)
    setEditingChat(null)
    setEditChatId('')
    setEditTitle('')
  }

  const handleSaveEdit = async () => {
    if (!editingChat) return

    const trimmedChatId = editChatId.trim()
    const trimmedTitle = editTitle.trim()

    if (trimmedChatId === editingChat.chat_id && trimmedTitle === (editingChat.chat_title || '')) {
      handleCancelEdit()
      return
    }

    try {
      const response = await fetch(`/api/integrations/telegram/chats/${editingChat.chat_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: trimmedChatId || null,
          chat_title: trimmedTitle || null
        })
      })

      if (response.ok) {
        await fetchChats()
        handleCancelEdit()
      } else {
        const errorData = await response.json()
        alert(`Error updating chat: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating chat:', error)
      alert('Error updating chat. Please try again.')
    }
  }

  if (isLoading) {
    return showHeaderButton ? null : <div>Loading...</div>
  }

  // If showHeaderButton is true, only render the button
  if (showHeaderButton) {
    return (
      <Button
        onClick={handleOpenAddDrawer}
        disabled={!integrationStatus.bot_configured}
      >
        <Plus size={16} style={{ marginRight: '8px' }} />
        Add Telegram Chat
      </Button>
    )
  }

  return (
    <div>
      {/* Integration Status */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {integrationStatus.bot_configured ? (
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#f59e0b' }} />
          )}
          <span style={{ fontWeight: '600' }}>
            {integrationStatus.bot_configured ? 'Bot Configured' : 'Bot Not Configured'}
          </span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          {integrationStatus.bot_configured
            ? `The Telegram bot (@${integrationStatus.bot_username}) is configured and ready to send messages.`
            : 'The Telegram bot is not configured yet. Contact an administrator to set up the bot.'
          }
        </p>
      </div>

      {/* Connected Chats */}
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
          Connected Chats ({chats.length})
        </h3>
        {chats.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <MessageCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No Telegram chats connected yet.</p>
            <p style={{ fontSize: '0.875rem' }}>Add a chat above to start receiving notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {chat.chat_title || `Chat ${chat.chat_id}`}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    ID: {chat.chat_id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Added {formatHumanReadableDate(chat.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={chat.is_active}
                      onChange={() => handleToggleChat(chat)}
                      style={{ margin: 0 }}
                    />
                    Active
                  </label>
                  <Button
                    size="sm"
                    variant={chat.is_default ? "primary" : "ghost"}
                    onClick={() => handleSetDefaultChat(chat)}
                  >
                    <Star size={16} fill={chat.is_default ? "currentColor" : "none"} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(chat)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveChat(chat.chat_id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Chat Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={handleCancelEdit}
        position="right"
      >
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Edit Chat
          </h3>
          {editingChat && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Telegram Chat ID
                </label>
                <Input size="sm"
                  value={editChatId}
                  onChange={(value) => setEditChatId(value.startsWith('+') ? value.slice(1) : value)}
                  placeholder="e.g., 123456789 or @username"
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  The Telegram chat identifier. We&apos;ll add a tutorial on how to get this soon.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                  Chat Title
                </label>
                <Input size="sm"
                  value={editTitle}
                  onChange={setEditTitle}
                  placeholder="Enter a custom title for this chat"
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Leave empty to use the default &ldquo;Chat [ID]&rdquo; format
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* Add Chat Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={handleCloseAddDrawer}
        position="right"
      >
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Add Telegram Chat
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Chat ID *
              </label>
              <Input size="sm"
                value={formData.chat_id}
                onChange={(value) => setFormData({ ...formData, chat_id: value })}
                placeholder="e.g., 123456789 or @username"
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Get this from the bot by sending /start in your Telegram chat
              </p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                Chat Title (Optional)
              </label>
              <Input size="sm"
                value={formData.chat_title}
                onChange={(value) => setFormData({ ...formData, chat_title: value })}
                placeholder="e.g., My Personal Chat"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <Button
                size="sm"
                onClick={handleAddChat}
                disabled={!formData.chat_id.trim() || isSubmitting}
              >
                <Plus size={16} style={{ marginRight: '8px' }} />
                {isSubmitting ? 'Adding...' : 'Add Chat'}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCloseAddDrawer}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}