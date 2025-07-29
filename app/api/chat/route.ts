import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // GitHub Pages에서는 서버 사이드 API가 작동하지 않으므로
  // 클라이언트 사이드에서 직접 OpenAI API를 호출하도록 안내
  return NextResponse.json(
    { 
      error: "GitHub Pages 환경에서는 서버 사이드 API가 지원되지 않습니다. 클라이언트 사이드에서 직접 OpenAI API를 호출합니다.",
      redirectToClient: true
    },
    { status: 400 }
  )
}
