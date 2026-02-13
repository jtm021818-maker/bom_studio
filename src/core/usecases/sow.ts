import type { AiProvider } from '@/core/types/ai';
import type { SowGenerationInput } from '@/core/types/sow';

const SOW_SYSTEM_PROMPT = `당신은 AI 영상 제작 프로젝트의 작업 범위 기술서(SOW, Statement of Work)를 작성하는 전문가입니다.
다음 규칙을 따라 SOW를 작성해주세요:

1. 마크다운 형식으로 작성
2. 한국어로 작성
3. 다음 섹션을 포함:
   - 프로젝트 개요
   - 작업 범위 (사전 제작, 제작, 후반 작업)
   - 납품물 목록
   - 일정 (마감일 기반)
   - 예산 범위 내 마일스톤 분할
   - 수정 정책
   - 유의사항 (금지 요소 포함)
4. 영상 브리프 정보를 반영하여 구체적으로 작성
5. 예산은 정수 원화(KRW)로 표시
6. 전문적이고 명확한 어조 사용`;

function buildUserPrompt(input: SowGenerationInput): string {
  let prompt = `다음 프로젝트 정보를 기반으로 SOW(작업 범위 기술서)를 작성해주세요.

## 프로젝트 기본 정보
- 제목: ${input.projectTitle}
- 설명: ${input.projectDescription}
- 카테고리: ${input.category}
- 예산 범위: ₩${input.budgetMin.toLocaleString('ko-KR')} ~ ₩${input.budgetMax.toLocaleString('ko-KR')}
- 마감일: ${input.deadline}`;

  if (input.videoBrief) {
    const vb = input.videoBrief;
    prompt += `

## 영상 브리프
- 채널/플랫폼: ${vb.channel}
- 영상 길이: ${vb.duration}
- 해상도: ${vb.resolution}
- 화면 비율: ${vb.aspectRatio}
- FPS: ${vb.fps}
- 스타일: ${vb.style}`;

    if (vb.prohibitedElements && vb.prohibitedElements.length > 0) {
      prompt += `\n- 금지 요소: ${vb.prohibitedElements.join(', ')}`;
    }
    if (vb.referenceUrls && vb.referenceUrls.length > 0) {
      prompt += `\n- 참고 URL: ${vb.referenceUrls.join(', ')}`;
    }
  }

  return prompt;
}

export function createSowUseCases(aiProvider: AiProvider) {
  return {
    /**
     * Generate SOW (non-streaming). Returns full text.
     */
    async generateSow(input: SowGenerationInput): Promise<string> {
      return aiProvider.generate({
        systemPrompt: SOW_SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(input),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },

    /**
     * Generate SOW as a stream. Yields incremental text chunks.
     */
    async *generateSowStream(input: SowGenerationInput) {
      yield* aiProvider.generateStream({
        systemPrompt: SOW_SYSTEM_PROMPT,
        userPrompt: buildUserPrompt(input),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },
  };
}
