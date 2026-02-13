import type { AiProvider } from '@/core/types/ai';
import type { SowGenerationInput } from '@/core/types/sow';

const STORYBOARD_SYSTEM_PROMPT = `당신은 AI 영상 프로젝트의 스토리보드를 작성하는 전문가입니다.
다음 규칙을 따라 스토리보드를 작성해주세요:

1. 마크다운 형식으로 작성
2. 한국어로 작성
3. 각 장면(Scene)별로 다음을 포함:
   - 장면 번호와 제목
   - 영상 설명 (구체적인 비주얼)
   - 장면의 목적/의도
   - 참고 레퍼런스 (있다면)
   - 예상 소요 시간
4. 영상 브리프의 스타일과 금지 요소를 반드시 준수
5. 장면 간 자연스러운 전환 고려
6. AI 생성 도구로 구현 가능한 수준의 묘사`;

const SHOTLIST_SYSTEM_PROMPT = `당신은 AI 영상 프로젝트의 샷 리스트를 작성하는 전문가입니다.
다음 규칙을 따라 샷 리스트를 작성해주세요:

1. 마크다운 테이블 형식으로 작성
2. 한국어로 작성
3. 각 샷에 다음 컬럼을 포함:
   | 샷 번호 | 카메라 | 움직임 | 효과 | 소요 시간 | 레퍼런스 |
4. 영상 브리프의 해상도, FPS, 화면비율 반영
5. AI 도구(Runway, Sora 등)로 구현 가능한 카메라 워크 위주
6. 금지 요소가 포함되지 않도록 주의`;

function buildPromptFromInput(input: SowGenerationInput, type: 'storyboard' | 'shotlist'): string {
  let prompt = `다음 프로젝트 정보를 기반으로 ${type === 'storyboard' ? '스토리보드' : '샷 리스트'}를 작성해주세요.

## 프로젝트 정보
- 제목: ${input.projectTitle}
- 설명: ${input.projectDescription}
- 카테고리: ${input.category}`;

  if (input.videoBrief) {
    const vb = input.videoBrief;
    prompt += `\n\n## 영상 브리프\n- 채널: ${vb.channel}\n- 길이: ${vb.duration}\n- 해상도: ${vb.resolution}\n- 비율: ${vb.aspectRatio}\n- FPS: ${vb.fps}\n- 스타일: ${vb.style}`;
    if (vb.prohibitedElements?.length) prompt += `\n- 금지 요소: ${vb.prohibitedElements.join(', ')}`;
    if (vb.referenceUrls?.length) prompt += `\n- 참고: ${vb.referenceUrls.join(', ')}`;
  }

  return prompt;
}

export function createStoryboardUseCases(aiProvider: AiProvider) {
  return {
    async *generateStoryboardStream(input: SowGenerationInput) {
      yield* aiProvider.generateStream({
        systemPrompt: STORYBOARD_SYSTEM_PROMPT,
        userPrompt: buildPromptFromInput(input, 'storyboard'),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },

    async *generateShotlistStream(input: SowGenerationInput) {
      yield* aiProvider.generateStream({
        systemPrompt: SHOTLIST_SYSTEM_PROMPT,
        userPrompt: buildPromptFromInput(input, 'shotlist'),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },

    async generateStoryboard(input: SowGenerationInput): Promise<string> {
      return aiProvider.generate({
        systemPrompt: STORYBOARD_SYSTEM_PROMPT,
        userPrompt: buildPromptFromInput(input, 'storyboard'),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },

    async generateShotlist(input: SowGenerationInput): Promise<string> {
      return aiProvider.generate({
        systemPrompt: SHOTLIST_SYSTEM_PROMPT,
        userPrompt: buildPromptFromInput(input, 'shotlist'),
        maxTokens: 3000,
        temperature: 0.7,
      });
    },
  };
}
