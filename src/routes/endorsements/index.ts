import { requireUser } from "../../middleware";
import { Endorsement } from "../../types";
import { sendNewApprovalEmail } from "../../email";
import { FastifyInstance } from "fastify";
import { createRequestConfig } from "../../util";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("/:handle", async (request, reply) => {
        const { handle } = request.params as any;
        // get offset and limit from query params

        const { offset, limit, includeUser } = request.query as { offset: number; limit: number; includeUser: boolean };

        // get owner user id from handle
        const { rows } = await instance.pg.query("SELECT * FROM users WHERE handle = $1", [handle]);
        if (rows.length === 0) {
          return reply.code(404).send();
        }
        const handleUser = rows[0];
        const handleUserId = handleUser.id;

        // query with offset and limit
        const results = await instance.pg.query(
          "SELECT * FROM endorsements where deleted_at is null and user_id = $1 LIMIT $2 OFFSET $3",
          [handleUserId, limit, offset]
        );

        const response: any = {
          endorsements: results.rows,
        };
        if (includeUser) {
          response.user = handleUser;
        }

        return response;
      });

      api.delete("/:endorsementId", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { endorsementId } = request.params as any;

        // Check that endorsement is owned by user
        const { rows } = await instance.pg.query(
          "SELECT * FROM endorsements WHERE (endorser_id = $1 OR user_id = $1)",
          [user.dbId]
        );
        if (rows.length === 0) {
          return reply.code(403).send();
        }

        // delete
        await instance.pg.query("update endorsements set deleted_at = now() WHERE id = $1", [endorsementId]);

        return {
          endorsementId,
          message: "Endorsement deleted",
        };
      });

      api.get("/pending", async (request, reply) => {
        const user = await requireUser(request, reply);

        // get pending endorsements
        const { rows } = await instance.pg.query(
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
        await instance.pg.query("UPDATE endorsements SET $column = now() WHERE user_id = $1 and id = $2", [
          column,
          userId,
          endorsementId,
        ]);

        return {
          endorsementId,
          action,
        };
      });

      api.post("", createRequestConfig(1), async (request, reply) => {
        const endorsement = request.body as Endorsement;
        const { handle } = request.params as any;

        // Check that handle exists and is associated with a user
        const { rows } = await instance.pg.query("SELECT * FROM users WHERE handle = $1", [handle]);
        if (rows.length === 0) {
          return reply.code(403).send();
        }

        const handleUser = rows[0];

        // insert
        const result = await instance.pg.query(
          "INSERT INTO endorsements (handle, user_id, endorser_id, message) VALUES ($1, $2, $3, $4)",
          [endorsement.handle, endorsement.name, endorsement.email, endorsement.message]
        );
        endorsement.id = result.rows[0].id;

        // Send approval notice email

        sendNewApprovalEmail(handleUser.email, handle);

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
