import type { AiProvider, AiGenerateOptions, AiStreamChunk } from '@/core/types/ai';

/**
 * Dummy AI provider for development/testing when OPENAI_API_KEY is not set.
 * Returns pre-written Korean SOW/Storyboard/Shotlist templates.
 */

const DUMMY_SOW_TEMPLATE = `# 작업 범위 기술서 (SOW)

## 1. 프로젝트 개요
본 프로젝트는 AI 기술을 활용한 영상 제작 프로젝트입니다. 의뢰인의 요구사항에 따라 고품질 AI 생성 영상을 제작합니다.

## 2. 작업 범위

### 2.1 사전 제작 (Pre-Production)
- 스토리보드 작성 및 검토
- 레퍼런스 분석 및 스타일 가이드 확정
- AI 도구 선정 및 파이프라인 구축
- 의뢰인과의 방향성 확인 미팅

### 2.2 제작 (Production)
- AI 모델을 활용한 영상 에셋 생성
- 장면별 AI 이미지/영상 생성
- 모션 적용 및 시퀀스 구성
- 사운드 디자인 및 음악 싱크

### 2.3 후반 작업 (Post-Production)
- 영상 편집 및 색보정
- 자막 및 타이틀 디자인
- 최종 렌더링 및 포맷 변환
- QC(품질 검수) 진행

## 3. 납품물
- 최종 영상 파일 (지정 해상도 및 포맷)
- 프로젝트 소스 파일 (요청 시)
- 작업 과정 보고서

## 4. 일정
- 사전 제작: 3일
- 본 제작: 5일
- 후반 작업: 2일
- 총 소요 기간: 10일 (영업일 기준)

## 5. 수정 정책
- 중간 검수 1회 포함
- 최종 납품 후 수정 2회 포함
- 추가 수정은 별도 협의

## 6. 유의사항
- 금지 요소 반영
- 참고 자료 스타일 준수
- 저작권 및 라이선스 준수
`;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createDummyAiProvider(): AiProvider {
  return {
    async generate(_options: AiGenerateOptions): Promise<string> {
      await delay(500);
      return DUMMY_SOW_TEMPLATE;
    },

    async *generateStream(_options: AiGenerateOptions): AsyncGenerator<AiStreamChunk> {
      // Simulate streaming by yielding chunks with small delays
      const words = DUMMY_SOW_TEMPLATE.split(/(?<=\s)/);
      const chunkSize = 3; // words per chunk

      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join('');
        await delay(30 + Math.random() * 20);
        yield { content: chunk, done: false };
      }

      yield { content: '', done: true };
    },
  };
}
