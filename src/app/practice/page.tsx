"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PracticePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/solve");
  }, [router]);

  return (
    <div className="glass p-8 text-center text-muted-foreground">
      Redirecting to Snooker Escape Solver…
    </div>
  );
}
