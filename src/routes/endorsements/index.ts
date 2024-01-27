import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { Endorsement } from "../../types";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/:handle", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle } = request.params;
        // get offset and limit from query params

        const { offset, limit } = request.query as { offset: number; limit: number };

        // query with offset and limit
        const results = await fastify.pg.query("SELECT * FROM endorsements WHERE handle = $1 LIMIT $2 OFFSET $3", [
          handle,
          limit,
          offset,
        ]);

        return {
          results,
        };
      });

      api.post("", async (request, reply) => {
        const endorsement = request.body as Endorsement;
        const user = requireUser(request, reply);
        const { handle } = request.params;

        // await fastify.pg.query("SELECT * FROM endorsements WHERE handle = $1", [handle]);
        // insert
        await fastify.pg.query(
          "INSERT INTO endorsements (handle, createdBy, name, email, message) VALUES ($1, $2, $3, $4)",
          [endorsement.handle, endorsement.name, endorsement.email, endorsement.message]
        );
        endorsement.id = 1; // TODO: get id from insert

        return {
          endorsement,
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
