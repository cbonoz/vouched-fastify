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

        // get owner user id from handle
        const { rows } = await fastifyPg.query("SELECT * FROM users WHERE handle = $1", [handle]);
        if (rows.length === 0) {
          return reply.code(404).send();
        }
        const userId = rows[0].id;

        // query with offset and limit
        const results = await fastifyPg.query(
          "SELECT * FROM endorsements where deleted_at is null and user_id = $1 LIMIT $2 OFFSET $3",
          [userId, limit, offset]
        );

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
        await fastifyPg.query("update endorsements set deleted_at = now() WHERE id = $1", [endorsementId]);

        return {
          endorsementId,
          message: "Endorsement deleted",
        };
      });

      api.get("/pending", async (request, reply) => {
        const user = await requireUser(request, reply);

        // get pending endorsements
        const { rows } = await fastifyPg.query(
          "SELECT * FROM endorsements WHERE approved_at is null and deleted_at is null and user_id = $1",
          [user.dbId]
        );

        return {
          endorsements: rows,
        };
      });

      api.post("/ack/:endorsementId", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { endorsementId } = request.params as any;
        const { action } = request.body as { action: string };

        const userId = user.dbId;

        let column;
        if (action === "reject") {
          column = "deleted_at"; // TODO: add rejected_at column
        } else if (action === "approve") {
          column = "approved_at";
        }

        // update
        await fastifyPg.query("UPDATE endorsements SET $column = now() WHERE user_id = $1 and id = $2", [
          column,
          userId,
          endorsementId,
        ]);

        return {
          endorsementId,
          action,
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
        const result = await fastifyPg.query(
          "INSERT INTO endorsements (handle, user_id, endorser_id, message) VALUES ($1, $2, $3, $4)",
          [endorsement.handle, endorsement.name, endorsement.email, endorsement.message]
        );
        endorsement.id = result.rows[0].id;

        // Send approval notice email

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
