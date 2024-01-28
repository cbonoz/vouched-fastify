import fastify, { FastifyInstance } from "fastify";
import { requireUser } from "../../middleware";
import { Endorsement } from "../../types";
import { fastifyPg } from "../../db";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/:handle", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle } = request.params as any;
        // get offset and limit from query params

        const { offset, limit } = request.query as { offset: number; limit: number };

        // query with offset and limit
        const results = await fastifyPg.query("SELECT * FROM endorsements WHERE handle = $1 LIMIT $2 OFFSET $3", [
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

        // Check that endorsement is owned by user
        const { rows } = await fastifyPg.query("SELECT * FROM endorsements WHERE (endorser_id = $1 OR user_id = $1)", [
          user.dbId,
        ]);
        if (rows.length === 0) {
          return reply.code(403).send();
        }

        // delete
        await fastifyPg.query("DELETE FROM endorsements WHERE id = $1", [endorsementId]);

        return {
          id: endorsementId,
          message: "Endorsement deleted",
        };
      });

      api.post("/approve/:endorsementId", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { endorsementId } = request.params as any;

        const userId = user.dbId;

        // update
        await fastifyPg.query("UPDATE endorsements SET approved_at = now() WHERE user_id = $1 and id = $2", [
          userId,
          endorsementId,
        ]);

        return {
          id: endorsementId,
          message: "Endorsement approved",
        };
      });

      api.post("", async (request, reply) => {
        const endorsement = request.body as Endorsement;
        const user = requireUser(request, reply);
        const { handle } = request.params as any;

        // Check that handle exists and is associated with a user
        const { rows } = await fastifyPg.query("SELECT * FROM users WHERE handle = $1", [handle]);
        if (rows.length === 0) {
          return reply.code(403).send();
        }

        // insert
        await fastifyPg.query(
          "INSERT INTO endorsements (handle, user_id, endorser_id, message) VALUES ($1, $2, $3, $4)",
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
