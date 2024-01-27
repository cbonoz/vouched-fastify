import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/:handle", async (request, reply) => {
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
      prefix: "/endorsements",
    }
  );
};

export default {
  registerRoutes,
};
