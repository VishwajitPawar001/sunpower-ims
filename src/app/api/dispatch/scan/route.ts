import { NextRequest } from "next/server";
import { POST as dispatchPost } from "../route";

export async function POST(req: NextRequest) {
  return dispatchPost(req);
}
