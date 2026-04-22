'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Plantilla, WithId } from '@/lib/types'

export default function PreviewPlantillaPage() {
  const { id } = useParams<{ id: string }>()
  const { authHeader } = useGlobal()
  const [plantilla, setPlantilla] = useState<WithId<Plantilla> | null>(null)
  const [context, setContext] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<{ html: string; subject: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState('')
  const [tab, setTab] = useState<'preview' | 'raw'>('preview')

  useEffect(() => {
    fetch(`/api/plantillas/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: WithId<Plantilla>) => {
        setPlantilla(data)
        // Context inicial con strings vacíos
        const ctx: Record<string, string> = {}
        data.variables?.forEach((v) => { ctx[v] = `[${v}]` })
        setContext(ctx)
      })
  }, [id, authHeader])

  const loadPreview = useCallback(async () => {
    if (!plantilla) return
    const res = await fetch(`/api/plantillas/${id}/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ context }),
    })
    const data = await res.json()
    if (!data.error) setPreview(data)
  }, [plantilla, id, context, authHeader])

  useEffect(() => {
    if (plantilla) loadPreview()
  }, [plantilla, loadPreview])

  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setSendResult('')
    try {
      const res = await fetch(`/api/plantillas/${id}/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ to: testEmail, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSendResult('✓ Email enviado a MailHog')
    } catch (err) {
      setSendResult(`✗ ${(err as Error).message}`)
    } finally {
      setSending(false)
    }
  }

  if (!plantilla) return <div className="p-8 text-sm text-gray-400">Cargando…</div>

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/plantillas" className="text-indigo-600 hover:underline text-sm">← Plantillas</Link>
        <span className="text-gray-300">|</span>
        <Link href={`/plantillas/${id}`} className="text-indigo-600 hover:underline text-sm">Editar</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{plantilla.name}</h1>

      <div className="flex gap-6 mt-6">
        {/* Columna izquierda: variables + test send */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Variables */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Variables de prueba</h3>
            {plantilla.variables?.length === 0 ? (
              <p className="text-xs text-gray-400">Sin variables detectadas</p>
            ) : (
              <div className="space-y-2">
                {plantilla.variables?.map((v) => (
                  <div key={v}>
                    <label className="block text-xs text-gray-500 mb-0.5">{`{{${v}}}`}</label>
                    <input
                      type="text"
                      value={context[v] || ''}
                      onChange={(e) => setContext({ ...context, [v]: e.target.value })}
                      onBlur={loadPreview}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
                <button onClick={loadPreview}
                  className="w-full mt-1 bg-indigo-50 text-indigo-700 text-xs font-medium py-1.5 rounded hover:bg-indigo-100 transition">
                  Actualizar preview
                </button>
              </div>
            )}
          </div>

          {/* Test send */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Envío de prueba</h3>
            <form onSubmit={handleTestSend} className="space-y-2">
              <input type="email" required value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@mailhog.local"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <button type="submit" disabled={sending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 rounded transition">
                {sending ? 'Enviando…' : 'Enviar a MailHog'}
              </button>
              {sendResult && (
                <p className={`text-xs ${sendResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {sendResult}
                </p>
              )}
            </form>
            <p className="text-xs text-gray-400 mt-2">
              Ver en{' '}
              <a href="http://localhost:8025" target="_blank" className="text-indigo-500 hover:underline">
                MailHog UI
              </a>
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 min-w-0">
          {preview && (
            <div className="mb-2 px-4 py-2 bg-gray-100 rounded-lg text-xs text-gray-600">
              <span className="font-medium">Asunto:</span> {preview.subject}
            </div>
          )}
          <div className="flex gap-1 mb-2">
            <button onClick={() => setTab('preview')}
              className={`text-xs px-3 py-1 rounded-t border-b-2 transition ${tab === 'preview' ? 'border-indigo-600 text-indigo-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Preview
            </button>
            <button onClick={() => setTab('raw')}
              className={`text-xs px-3 py-1 rounded-t border-b-2 transition ${tab === 'raw' ? 'border-indigo-600 text-indigo-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              HTML
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: 400 }}>
            {tab === 'preview' ? (
              preview ? (
                <iframe
                  srcDoc={preview.html}
                  className="w-full"
                  style={{ height: 600, border: 'none' }}
                  title="Email preview"
                />
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">Generando preview…</div>
              )
            ) : (
              <pre className="p-4 text-xs font-mono text-gray-700 overflow-auto" style={{ maxHeight: 600 }}>
                {preview?.html || ''}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
