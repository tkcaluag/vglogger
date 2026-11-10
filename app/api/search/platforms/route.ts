import { connection } from "next/server";
import { queryIgdb } from "@/lib/igdb";

type IgdbPlatform = {
  id: number;
  name: string;
};

export async function GET() {
  await connection();

  try {
    const platforms = await queryIgdb<IgdbPlatform>(
      "platforms",
      "fields id, name; sort name asc; limit 500;",
    );

    return Response.json(platforms);
  } catch (error) {
    console.error("Platform list request failed.", error);
    return Response.json({ error: "Platforms could not be loaded." }, { status: 500 });
  }
}
