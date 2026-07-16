import { OtpResponse } from "./api";

export function getOtpExpiresAt(response: OtpResponse) {
  const expiresAt = response.otp_expires_at || response.data?.otp_expires_at;
  if (expiresAt) return expiresAt;

  const rawExpiresIn = response.otp_expires_in || response.data?.otp_expires_in;
  const expiresIn = Number(rawExpiresIn);

  if (Number.isFinite(expiresIn) && expiresIn > 0) {
    return new Date(Date.now() + expiresIn * 1000).toISOString();
  }

  return null;
}

export function getOtpSecondsLeft(expiresAt: string | null) {
  if (!expiresAt) return 0;

  const expiresAtMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs)) return 0;

  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
}

export function isOtpSentResponse(response: OtpResponse) {
  return response.success === true || response.statusCode === 200 || response.statusCode === 2;
}

export function formatOtpSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
