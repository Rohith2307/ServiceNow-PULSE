import { useEffect, useState } from 'react'
import './App.css'
import LandingPage from './components/LandingPage'
import StudentSelectionPage from './components/StudentSpace/StudentSelectionPage'
import StudentSpace from './components/StudentSpace/StudentSpace'
import UniversitySpace from './components/UniversitySpace/UniversitySpace'
import type { AppRoute, StudentScreen } from './types'

const STORAGE_KEY = 'pulse_selected_student_id'

function parseRoute(pathname: string): { route: AppRoute; studentScreen: StudentScreen } {
  const normalized = pathname.toLowerCase()

  if (normalized === '/' || normalized === '') {
    return { route: 'landing', studentScreen: 'pulse' }
  }

  if (normalized.startsWith('/student/select')) {
    return { route: 'student-select', studentScreen: 'pulse' }
  }

  if (normalized.startsWith('/university')) {
    return { route: 'university', studentScreen: 'pulse' }
  }

  if (normalized.includes('journey')) {
    return { route: 'student', studentScreen: 'journey' }
  }

  if (normalized.includes('support')) {
    return { route: 'student', studentScreen: 'support' }
  }

  if (normalized.includes('pulse') || normalized.startsWith('/student')) {
    return { route: 'student', studentScreen: 'pulse' }
  }

  return { route: 'landing', studentScreen: 'pulse' }
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEY) || null
  })

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path)
      setCurrentPath(path)
      window.scrollTo(0, 0)
    }
  }

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId)
    sessionStorage.setItem(STORAGE_KEY, studentId)
    navigateTo('/student/my-pulse')
  }

  const { route, studentScreen } = parseRoute(currentPath)

  // Direct access protection: if visiting a student screen without a selected student, redirect to /student/select
  if (route === 'student' && !selectedStudentId) {
    if (window.location.pathname !== '/student/select') {
      window.history.replaceState({}, '', '/student/select')
    }
    return (
      <StudentSelectionPage
        initialStudentId={selectedStudentId}
        onContinue={handleSelectStudent}
        onBackToHome={() => navigateTo('/')}
      />
    )
  }

  if (route === 'landing') {
    return (
      <LandingPage
        onSelectStudent={() => navigateTo('/student/select')}
        onSelectUniversity={() => navigateTo('/university')}
      />
    )
  }

  if (route === 'student-select') {
    return (
      <StudentSelectionPage
        initialStudentId={selectedStudentId}
        onContinue={handleSelectStudent}
        onBackToHome={() => navigateTo('/')}
      />
    )
  }

  if (route === 'university') {
    return <UniversitySpace onNavigateHome={() => navigateTo('/')} />
  }

  return (
    <StudentSpace
      selectedStudentId={selectedStudentId!}
      activeScreen={studentScreen}
      onNavigateScreen={(screen: StudentScreen) => {
        navigateTo(`/student/my-${screen}`)
      }}
      onNavigateHome={() => navigateTo('/')}
      onSwitchStudent={() => navigateTo('/student/select')}
    />
  )
}
