import { requireUser } from "../../middleware";
import { getAuth } from "@clerk/fastify";
import { sendAccessRequestEmailToAdmin } from "../../email";
import { FastifyInstance } from "fastify";

const registerRoutes = (instance: FastifyInstance) => {
  instance.register(
    (api, opts, done) => {
      api.get("", async (request, reply) => {
        return requireUser(request, reply);
      });

      api.patch("/info", async (request, reply) => {
        const user = requireUser(request, reply);
        const { handle, name } = request.params as any;

        await instance.pg.query("SELECT * FROM endorsements WHERE handle = $1", [handle]);

        return {
          message: "This is a public endpoint. Request /protected to test the Clerk auth middleware",
        };
      });

      // request invite
      api.post("/request-invite", async (request, reply) => {
        const { email, name } = request.body as any;

        // check if user exists
        const { rows } = await instance.pg.query("SELECT * FROM users WHERE email = $1", [email]);
        if (rows.length > 0) {
          return reply.code(409).send();
        }

        // split name
        const names = name.split(" ");
        const firstName = names[0];
        const lastName = names[1];

        // insert user
        await instance.pg.query("INSERT INTO users (email, first_name, last_name) VALUES ($1, $2)", [
          email,
          firstName,
          lastName,
        ]);

        // send email
        await sendAccessRequestEmailToAdmin(email, name);
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
