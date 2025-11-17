export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="text-center text-white space-y-8 p-8">
        <h1 className="text-6xl font-bold animate-fadeIn">Project Turing</h1>
        <p className="text-2xl animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          AI Among Us
        </p>
        <p className="text-lg opacity-90 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          누가 AI일까요? 5턴 안에 AI를 찾아내세요!
        </p>
        <div className="pt-4 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <button className="px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-opacity-90 transition-all">
            Google로 로그인
          </button>
        </div>
      </div>
    </div>
  )
}
