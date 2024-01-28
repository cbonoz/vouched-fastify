import { clerkClient, getAuth } from "@clerk/fastify";
import { FastifyReply, FastifyRequest } from "fastify";
// import from clerk
import { User } from "@clerk/backend/dist/types/api/resources/User";
import { fastifyPg } from "../db";

export interface VouchedUser extends User {
  dbId: number;
}

export const requireUser = async (request: FastifyRequest, reply: FastifyReply): Promise<VouchedUser> => {
  const { userId } = getAuth(request);
  if (!userId) {
    return reply.code(403).send();
  }

  const user = await clerkClient.users.getUser(userId);
  // Get user id from db
  let { rows } = await fastifyPg.query("SELECT * FROM users WHERE external_id = $1", [userId]);
  if (rows.length === 0) {
    // Create user
    const email = user.emailAddresses[0].emailAddress;
    await fastifyPg.query("INSERT INTO users (external_id, email, first_name, last_name) VALUES ($1, $2, $3, $4)", [
      userId,
      email,
      user.firstName,
      user.lastName,
    ]);
    const result = await fastifyPg.query("SELECT * FROM users WHERE external_id = $1", [userId]);
    rows = result.rows;
  }
  const dbUser = { ...user, dbId: rows[0].id };
  return dbUser;
};
