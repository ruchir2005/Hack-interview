import { API_BASE } from "@/app/lib/api";

export interface GenerateAvatarPayload {
  text: string;
  voice?: string;
  emotion?: string;
}

export interface GenerateAvatarResponse {
  video_url: string;
}

export async function generateAvatar(payload: GenerateAvatarPayload): Promise<GenerateAvatarResponse> {
  const res = await fetch(`${API_BASE}/generate_avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: payload.text,
      voice: payload.voice || 'en_male',
      emotion: payload.emotion || 'neutral'
    })
  });

  if (!res.ok) {
    throw new Error(`Avatar generation failed (${res.status})`);
  }
  return res.json();
}
