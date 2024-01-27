import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { getAuth } from "@clerk/fastify";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("", async (request, reply) => {
        return requireUser(request, reply);
      });

      done();
    },
    {
      prefix: "/user",
    }
  );
};
export default {
  registerRoutes,
};
