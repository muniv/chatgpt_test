"use client"

import { ChatbotUISVG } from "@/components/icons/chatbotui-svg"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconArrowRight, IconKey, IconBrandGithub } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { validateApiKey } from "@/lib/client-api"

export default function HomePage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) return

    setIsLoading(true)
    setError("")

    try {
      // API 키 유효성 검사
      const isValid = await validateApiKey(apiKey)
      
      if (isValid) {
        // API 키를 localStorage에 저장
        localStorage.setItem("openai_api_key", apiKey)
        router.push("/chat")
      } else {
        setError("유효하지 않은 API 키입니다. 다시 확인해주세요.")
      }
    } catch (error) {
      setError("API 키 검증 중 오류가 발생했습니다.")
      console.error("API 키 검증 오류:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApiKeySubmit()
    }
  }

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div>
        <ChatbotUISVG theme={theme === "dark" ? "dark" : "light"} scale={0.3} />
      </div>

      <div className="mt-2 text-4xl font-bold">AI ChatBot UI</div>
      <div className="mt-2 text-gray-600 dark:text-gray-400">
        GPT-4o, 웹 검색, 이미지 생성이 통합된 올인원 AI 어시스턴트
      </div>

      <div className="mt-6 w-full max-w-md space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <IconKey size={16} />
            OpenAI API Key
          </label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full"
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <Button
          onClick={handleApiKeySubmit}
          disabled={!apiKey.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? "검증 중..." : "채팅 시작"}
          <IconArrowRight className="ml-2" size={16} />
        </Button>

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            API 키는 브라우저에 안전하게 저장됩니다
          </p>
          <div className="flex items-center justify-center gap-2">
            <IconBrandGithub size={16} />
            <a 
              href="https://github.com/muniv/chatgpt_clone" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              GitHub 저장소
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
