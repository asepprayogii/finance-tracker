import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
  }, [])

  if (user === undefined) return <div style={{padding:'40px',textAlign:'center'}}>Loading...</div>
  if (user === null) return <Navigate to="/login" />
  return children
}