import { useState, useEffect } from 'react'
import { useI18n } from '../context/I18nContext'
import { getContacts, updateContact, deleteContact } from '../services/api'

export default function Contacts() {
  const { t } = useI18n()
  const [contacts, setContacts] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    loadContacts()
  }, [filterStatus])

  const loadContacts = async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (filterStatus) params.status = filterStatus
      const res = await getContacts(params)
      setContacts(res.items)
      setPagination({ page: res.page, pages: res.pages, total: res.total })
    } catch (error) {
      console.error('Failed to load contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateContact(id, { status: newStatus })
      loadContacts()
    } catch (error) {
      console.error('Failed to update:', error)
    }
  }

  const handleReply = async (id) => {
    const reply = prompt(t('reply') + ':')
    if (reply) {
      try {
        await updateContact(id, { status: 'replied', reply })
        loadContacts()
      } catch (error) {
        console.error('Failed to reply:', error)
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete'))) {
      try {
        await deleteContact(id)
        loadContacts()
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-2">
        <button
          onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-full text-sm ${!filterStatus ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
        >
          {t('all')}
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-full text-sm ${filterStatus === 'pending' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
        >
          {t('pending_reply')}
        </button>
        <button
          onClick={() => setFilterStatus('replied')}
          className={`px-3 py-1.5 rounded-full text-sm ${filterStatus === 'replied' ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}
        >
          {t('replied')}
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">{t('loading')}</div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500">{t('no_data')}</div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-slate-500 ml-3">{contact.phone}</span>
                  <span className={`ml-3 px-2 py-0.5 rounded text-xs ${
                    contact.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {contact.status === 'pending' ? t('pending_reply') : t('replied')}
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-600 mb-3">{contact.message}</p>
              {contact.reply && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm mb-3">
                  <span className="text-blue-600 font-medium">{t('reply')}: </span>
                  {contact.reply}
                </div>
              )}
              <div className="flex gap-2">
                {contact.status === 'pending' && (
                  <button
                    onClick={() => handleReply(contact.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    {t('reply_contact')}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="px-3 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg hover:bg-red-200"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
