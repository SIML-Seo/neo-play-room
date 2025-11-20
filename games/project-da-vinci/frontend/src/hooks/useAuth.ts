import { auth } from '@/firebase'
import { useAuthStore } from '@/store/authStore'
import { createUseAuth } from '@shared/hooks/useAuth'

export const useAuth = createUseAuth(auth, useAuthStore)
