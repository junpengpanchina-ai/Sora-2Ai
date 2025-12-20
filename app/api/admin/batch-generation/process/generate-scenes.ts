/**
 * 生成行业场景词（复用现有逻辑）
 */
export async function generateIndustryScenes(
  industry: string,
  scenesPerIndustry: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _useCaseType: string // 保留参数以保持接口一致性
): Promise<Array<{ id: number; use_case: string }>> {
  const { createChatCompletion } = await import('@/lib/grsai/client')
  
  const systemPrompt = `You are an SEO expert specializing in AI video generation use cases. Generate highly specific, practical, real-world use cases for AI video generation. All output must be in English.

CRITICAL: The AI video platform ONLY supports 10-second or 15-second videos. NEVER mention any duration longer than 15 seconds (such as 20 seconds, 30 seconds, 45 seconds, 60 seconds, 1 minute, 2 minutes, etc.). When describing video examples, ALWAYS use "10 seconds" or "15 seconds" only.`

  // 如果数量超过 50，分批生成
  const batchSize = Math.min(scenesPerIndustry, 50)
  const batches = Math.ceil(scenesPerIndustry / batchSize)
  const allScenes: Array<{ id: number; use_case: string }> = []

  for (let batch = 0; batch < batches; batch++) {
    const currentBatchSize = batch === batches - 1 
      ? scenesPerIndustry - (batch * batchSize) 
      : batchSize

    const userPrompt = `Generate ${currentBatchSize} highly specific, practical, real-world use cases for AI video generation for the following industry:

Industry: ${industry}

Requirements:
- ${currentBatchSize} use cases
- Each use case = 300–500 characters (detailed scenario description)
- Must be specific, not generic
- Must be real-world scenarios where AI video creation is actually needed
- Each use case should describe:
  1. The specific scenario/situation
  2. The pain point or challenge
  3. Why AI video is suitable for this scenario
  4. A brief example prompt idea
- IMPORTANT: When mentioning video duration, ALWAYS use "10 seconds" or "15 seconds" ONLY. NEVER mention "20 seconds", "30 seconds", "45 seconds", "60 seconds", "1 minute", "2 minutes", or any duration longer than 15 seconds.
- Format as a clean JSON array: 
[
  {"id": 1, "use_case": "Detailed 300-500 character description including scenario, pain point, why AI video, and example prompt (video duration: 10 seconds or 15 seconds ONLY)"},
  {"id": 2, "use_case": "..."},
  ...
  {"id": ${currentBatchSize}, "use_case": "..."}
]
Do not include explanations. Output only the JSON.`

    try {
      const response = await createChatCompletion({
        model: 'gemini-2.5-flash',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      })

      const content = response.choices?.[0]?.message?.content || ''
      if (!content) {
        throw new Error('生成的内容为空')
      }

      // 解析 JSON
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      let scenes: Array<{ id: number; use_case: string }> = []
      
      try {
        scenes = JSON.parse(jsonContent)
      } catch {
        // 尝试修复 JSON
        const jsonMatch = jsonContent.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          scenes = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析 JSON')
        }
      }

      // 调整 ID 以保持连续性
      scenes.forEach((scene, idx) => {
        scene.id = batch * batchSize + idx + 1
      })
      
      allScenes.push(...scenes.filter(s => s && s.use_case && s.use_case.trim().length > 50))

      // 批次之间稍作延迟
      if (batch < batches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } catch (error) {
      console.error(`[${industry}] 批次 ${batch + 1} 生成失败:`, error)
      throw error
    }
  }

  return allScenes.slice(0, scenesPerIndustry)
}

