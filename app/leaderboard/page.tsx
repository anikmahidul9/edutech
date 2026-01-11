import { Trophy, Coins } from "lucide-react"
import { UserRow } from "@/components/leaderboard/user-row"
import { getUsers } from "@/lib/data/get-users"

export default async function LeaderboardPage() {
  const users = await getUsers()

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-yellow-50 to-white">
      {/* Decorative blur */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-yellow-200/40 blur-3xl" />

      <div className="container mx-auto px-4 py-14">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-gray-900">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400">
                <Trophy className="h-6 w-6 text-black" />
              </span>
              Leaderboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Top performers ranked by total coins earned
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              {users.length} Players
            </span>
          </div>
        </div>

        {/* Leaderboard Card */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          {/* Table Header */}
          <div className="bg-yellow-100/60 px-6 py-4">
            <div className="grid grid-cols-3 text-sm font-semibold text-gray-700">
              <div>Rank</div>
              <div>User</div>
              <div className="text-right">Coins</div>
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {users.map((user, index) => (
              <UserRow
                key={user.id}
                user={user}
                rank={index + 1}
              />
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Rankings update automatically based on user activity
        </p>
      </div>
    </main>
  )
}
