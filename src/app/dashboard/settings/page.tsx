'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Key, Code } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)

    if (error) setPwError(error.message)
    else {
      setPwSuccess(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences.</p>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} className="text-gray-500" />
          <h2 className="text-sm font-medium text-gray-800">Change password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {pwError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Password updated successfully!</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:opacity-40"
          >
            <Save size={13} /> {saving ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>

      {/* Developer API */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code size={15} className="text-gray-500" />
          <h2 className="text-sm font-medium text-gray-800">Developer — Bring your own Supabase</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Want to self-host BlogForge with your own Supabase project? Follow our integration guide to connect your own database.
        </p>
        <a
          href="/docs/self-host"
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          View integration guide →
        </a>
      </div>
    </div>
  )
}
