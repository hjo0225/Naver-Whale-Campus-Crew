/**
 * 부스 운영 단일 진실 공급원.
 * 추천인 코드는 행사 직전에 운영진이 이 한 줄만 바꾸면 모든 화면에 반영됩니다.
 */
export const REFERRAL_CODE = "hyu1784";

export const APP_DOWNLOAD = {
  android: "https://play.google.com/store/apps/details?id=com.naver.whale",
  ios: "https://apps.apple.com/kr/app/id1374073304",
};

/**
 * 랜딩 자동 슬라이드: 어떤 슬라이드를 어떤 순서로 보여줄지.
 * 0=인트로, 1~4=기능, 5=게임시작 — 매 기능마다 인트로/게임시작이 끼어드는 순환.
 */
export const SLIDE_PATTERN = [0, 1, 5, 0, 2, 5, 0, 3, 5, 0, 4, 5] as const;
export const SLIDE_DURATION_MS = 6000;
