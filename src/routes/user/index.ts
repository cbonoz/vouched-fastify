import { requireUser } from "../../middleware";
import { clerkClient, getAuth } from "@clerk/fastify";
import { sendAccessRequestEmailToAdmin } from "../../email";
import { FastifyInstance } from "fastify";
import { createRequestConfig } from "../../util";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("", async (request, reply) => {
        return requireUser(request, reply);
      });

      api.patch("/info", async (request, reply) => {
        const user = await requireUser(request, reply);
        const { handle, firstName, lastName, active } = request.body as any;
        if (!handle || !firstName || !lastName) {
          const message = "handle, firstName, and lastName are required";
          throw new Error(message);
        }

        await instance.pg.query("UPDATE users SET handle = $1, first_name = $2, last_name = $3 WHERE id = $3", [
          handle,
          firstName,
          lastName,
          user.dbId,
        ]);

        // Update user
        await clerkClient.users.updateUser(user.id, {
          firstName,
          lastName,
        });

        const res = await requireUser(request, reply);
        return res;
      });

      // request invite
      api.post("/request-invite", createRequestConfig(1), async (request, reply) => {
        const { email, name } = request.body as any;

        // check if user exists
        const { rows } = await instance.pg.query("SELECT * FROM users WHERE email = $1", [email]);
        if (rows.length > 0) {
          return reply.code(409).send();
        }

        // split name
        const names = name.split(" ");
        const firstName = names[0].trim();
        // take rest
        const lastName = names.slice(1).join(" ").trim();

        if (!firstName || !lastName) {
          const message = "Separate first and last name with at least one space";
          throw new Error(message);
        }

        // insert user
        await instance.pg.query("INSERT INTO users (email, first_name, last_name) VALUES ($1, $2, $3)", [
          email,
          firstName,
          lastName,
        ]);

        // send email
        await sendAccessRequestEmailToAdmin(email, name);

        reply.code(201).send();
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
