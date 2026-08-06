"use client";

import { ImgHTMLAttributes, ReactNode, useEffect, useState } from "react";

type PublicAssetImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fallback?: ReactNode;
};

function shouldFetchWithoutCookies(src: string) {
  return src.includes("/uploads/");
}

export function PublicAssetImage({
  src,
  fallback = null,
  onError,
  ...props
}: PublicAssetImageProps) {
  const [objectUrl, setObjectUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const shouldProxy = shouldFetchWithoutCookies(src);
  const imageSrc = shouldProxy ? objectUrl : src;

  useEffect(() => {
    setFailed(false);

    if (!src || !shouldProxy) {
      setObjectUrl("");
      return;
    }

    let cancelled = false;
    let nextObjectUrl = "";

    fetch(src, { credentials: "omit", cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load image.");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
      setObjectUrl("");
    };
  }, [shouldProxy, src]);

  if (failed) return <>{fallback}</>;
  if (!imageSrc) return <>{fallback}</>;

  return (
    <img
      {...props}
      src={imageSrc}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
