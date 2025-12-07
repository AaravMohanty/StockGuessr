"use client";

import GameManager from "@/components/GameManager";
import { useParams } from "next/navigation";

export default function JoinGamePage() {
    const params = useParams();
    const joinCode = params.joinCode as string;

    return <GameManager initialJoinCode={joinCode} />;
}
