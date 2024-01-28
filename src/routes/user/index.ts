import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { getAuth } from "@clerk/fastify";
import { fastifyPg } from "../../db";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("", async (request, reply) => {
        return requireUser(request, reply);
      });

      api.patch("/info", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle, name } = request.params as any;

        await fastifyPg.query("SELECT * FROM endorsements WHERE handle = $1", [handle]);

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
