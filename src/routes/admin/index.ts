import { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/endorsements", async (request, reply) => {
        const user = requireUser(request, reply);

        return {
          message: "This is a public endpoint. Request /protected to test the Clerk auth middleware",
        };
      });

      done();
    },
    {
      prefix: "/admin",
    }
  );
};

export default {
  registerRoutes,
};
