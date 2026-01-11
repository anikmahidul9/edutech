
import Image from "next/image"
import { User } from "@/lib/types"

interface UserRowProps {
  user: User
  rank: number
}

export function UserRow({ user, rank }: UserRowProps) {
  return (
    <div className="grid grid-cols-3 items-center px-6 py-4">
      <div className="col-span-1 text-lg font-semibold">{rank}</div>
      <div className="col-span-1 flex items-center gap-4">
        <Image
          src={user.photoURL || "/placeholder-user.jpg"}
          alt={user.displayName || "User"}
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-medium">{user.displayName || "User"}</span>
      </div>
      <div className="col-span-1 text-right font-semibold">{user.coins ?? 0}</div>
    </div>
  )
}
