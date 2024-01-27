import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { getAuth } from "@clerk/fastify";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("", async (request, reply) => {
        return requireUser(request, reply);
      });

      api.patch("/info", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle } = request.params;

        await fastify.pg.query("SELECT * FROM endorsements WHERE handle = $1", [handle]);

        return {
          message: "This is a public endpoint. Request /protected to test the Clerk auth middleware",
        };
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
