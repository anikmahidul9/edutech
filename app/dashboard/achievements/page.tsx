"use client"

import { Trophy } from "lucide-react"

export default function AchievementsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">Achievements</h1>
      <p className="text-muted-foreground text-lg">This feature is coming soon!</p>
      <p className="text-sm text-muted-foreground mt-2">Stay tuned for exciting updates.</p>
    </div>
  )
}
