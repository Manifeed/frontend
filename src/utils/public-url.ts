export function safeExternalHref(value: string | null | undefined): string | null {
  return normalizePublicUrl(value, { requireHttps: false });
}

export function safeImageSrc(value: string | null | undefined): string | null {
  return normalizePublicUrl(value, { requireHttps: true });
}

function normalizePublicUrl(
  value: string | null | undefined,
  options: { requireHttps: boolean },
): string | null {
  const candidate = value?.trim() ?? "";
  if (!candidate || /[\u0000-\u001f\u007f]/u.test(candidate)) {
    return null;
  }

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
    if (options.requireHttps && parsedUrl.protocol !== "https:") {
      return null;
    }
    if (!parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
}
