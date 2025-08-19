"use client"

import { useState } from 'react'

export default function ManualRegister() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [registrations, setRegistrations] = useState<Array<{email: string, name: string}>>([])
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !name) {
      setMessage('Please enter both email and name')
      return
    }

    // Add to list
    const newReg = { email, name }
    setRegistrations(prev => [...prev, newReg])
    setMessage(`✅ Added ${name} (${email})`)
    
    // Clear form
    setEmail('')
    setName('')
  }

  const exportCSV = () => {
    let csv = 'contact,name,timestamp,type\n'
    registrations.forEach(reg => {
      csv += `"${reg.email}","${reg.name}","${new Date().toISOString()}","EMAIL"\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'party_registrations.csv'
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#8B7D7A] p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Manual Registration</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">USC Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="name@usc.edu"
              pattern=".*@usc\.edu$"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="John Doe"
              maxLength={40}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-[#8B7D7A] text-white p-3 rounded-lg hover:bg-[#7a6f6c]"
          >
            Add Registration
          </button>
        </form>
        
        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
            {message}
          </div>
        )}
        
        {registrations.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Registrations ({registrations.length})</h2>
            
            <button
              onClick={exportCSV}
              className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Download CSV
            </button>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {registrations.map((reg, i) => (
                <div key={i} className="bg-gray-50 p-2 rounded text-sm">
                  <strong>{reg.name}</strong> - {reg.email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}