import { useState } from 'react'
import { useSmartPen } from '@/hooks/useSmartPen'

export default function SmartPenConnection() {
  const { state, connect, disconnect, submitPassword } = useSmartPen({
    canvasSize: { width: 0, height: 0 }, // 연결 전용이므로 캔버스 크기는 무의미
  })
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-4">
      {/* 연결 상태 표시 */}
      <div className="flex items-center justify-between bg-gallery-floor/30 p-3 rounded-lg border border-gold-dark/30">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              state.isPasswordRequired
                ? 'bg-warning animate-pulse'
                : state.isConnected
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-gray-500'
            }`}
          />
          <span
            className={`font-crimson font-bold ${
              state.isPasswordRequired
                ? 'text-warning'
                : state.isConnected
                  ? 'text-green-400'
                  : 'text-gray-400'
            }`}
          >
            {state.isPasswordRequired
              ? '비밀번호 입력 대기 중'
              : state.isConnected
                ? '연결됨'
                : '연결 안 됨'}
          </span>
        </div>
        {state.isConnected && (
          <span className="text-sm text-gold-light font-crimson">
            배터리: {state.battery}%
          </span>
        )}
      </div>

      {/* 액션 버튼 */}
      {state.isConnected ? (
        <button
          onClick={disconnect}
          className="w-full px-4 py-2 bg-velvet-red/20 text-velvet-burgundy border border-velvet-red rounded-lg hover:bg-velvet-red/30 transition-colors font-crimson font-bold"
        >
          연결 해제
        </button>
      ) : (
        <button
          onClick={connect}
          disabled={state.isScanning}
          className="w-full px-4 py-2 bg-gold-frame text-gallery-floor rounded-lg hover:bg-gold-light disabled:bg-gray-600 disabled:text-gray-400 transition-colors font-playfair font-bold flex items-center justify-center gap-2"
        >
          {state.isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-gallery-floor border-t-transparent rounded-full animate-spin" />
              <span>찾는 중...</span>
            </>
          ) : (
            <>
              <span>🖊️</span>
              <span>스마트펜 연결하기</span>
            </>
          )}
        </button>
      )}

      {/* 에러 메시지 */}
      {state.error && (
        <div className="text-xs text-velvet-red bg-velvet-red/10 p-2 rounded border border-velvet-red/30">
          {state.error}
        </div>
      )}

      {/* 비밀번호 입력 모달 */}
      {state.isPasswordRequired && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-wood-dark p-6 rounded-lg shadow-gallery w-80 border-2 border-gold-frame relative overflow-hidden">
            {/* 배경 효과 */}
            <div className="absolute inset-0 bg-wood-texture opacity-20 pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="text-xl font-playfair font-bold mb-4 text-gold-frame gold-glow">
                🔒 스마트펜 비밀번호
              </h3>
              <p className="text-base text-gallery-cream/90 mb-4 font-crimson">
                연결하려는 펜의 비밀번호를 입력해주세요.
                <br />
                <span className="text-sm text-gold-light/70 mt-1 block">(초기 비밀번호: 0000)</span>
              </p>
              <div className="relative mb-6">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    console.log('[SmartPenConnection] Input change:', e.target.value)
                    setPasswordInput(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      console.log('[SmartPenConnection] Enter key pressed, submitting:', passwordInput)
                      submitPassword(passwordInput)
                      setPasswordInput('')
                    }
                  }}
                  className="w-full border-2 border-gold-dark/50 p-3 rounded-lg bg-gallery-floor text-gallery-cream placeholder-gallery-cream/30 focus:border-gold-frame focus:outline-none focus:ring-1 focus:ring-gold-frame/50 font-crimson text-lg tracking-widest text-center pr-10"
                  placeholder="••••"
                  maxLength={4}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gallery-cream/50 hover:text-gold-light transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end gap-3 font-crimson">
                <button
                  onClick={() => {
                    disconnect()
                    setPasswordInput('')
                  }}
                  className="px-4 py-2 text-gallery-cream/70 hover:text-gallery-cream hover:bg-wood-medium rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    console.log('[SmartPenConnection] Submit button clicked, submitting:', passwordInput)
                    submitPassword(passwordInput)
                    setPasswordInput('')
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-gold-dark to-gold-frame text-gallery-floor font-bold rounded hover:from-gold-frame hover:to-gold-light transition-all shadow-frame-gold hover:scale-105"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
