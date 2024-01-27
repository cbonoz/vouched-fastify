import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { Endorsement } from "../../types";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/:handle", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle } = request.params as any;
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

      api.delete("/:endorsementId", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { endorsementId } = request.params as any;

        const userId = user.id;

        // delete
        await fastify.pg.query("DELETE FROM endorsements WHERE id = $1 and createdBy = $2", [endorsementId, userId]);

        return {
          message: "Endorsement deleted",
        };
      });

      api.post("/approve/:endorsementId", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { endorsementId } = request.params as any;

        const userId = user.id;

        // update
        await fastify.pg.query("UPDATE endorsements SET approvedAt = $1 WHERE id = $2", [userId, endorsementId]);

        return {
          message: "Endorsement approved",
        };
      });

      api.post("", async (request, reply) => {
        const endorsement = request.body as Endorsement;
        const user = requireUser(request, reply);
        const { handle } = request.params as any;

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
