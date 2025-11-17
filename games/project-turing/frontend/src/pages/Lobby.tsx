export default function Lobby() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">대기실</h1>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <p className="text-2xl font-semibold">대기 중: 1/5</p>
            <p className="text-gray-600 mt-2">5명의 플레이어가 모이면 게임이 시작됩니다</p>
          </div>
          <div className="space-y-4">
            {/* 플레이어 목록 */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <p className="font-semibold">대기 중...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
