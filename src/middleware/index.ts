import { clerkClient, getAuth } from "@clerk/fastify";
import { FastifyReply, FastifyRequest } from 'fastify';

export const requireUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = getAuth(request);
  if (!userId) {
    return reply.code(403).send();
  }

  const user = await clerkClient.users.getUser(userId);
  return user
};
