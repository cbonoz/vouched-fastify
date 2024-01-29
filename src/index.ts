import "./loadEnv";

import Fastify, { FastifyPluginCallback } from "fastify";
import { clerkClient, clerkPlugin, getAuth } from "@clerk/fastify";
import admin from "./routes/admin";
import user from "./routes/user";
import endorsements from "./routes/endorsements";
import cors from "@fastify/cors";

import { initDB } from "./db/migrate";
import { setInstance } from "./server/instance";

const fastifyListRoutes = require("fastify-list-routes");

const fastify = Fastify({
  logger: { level: "info" },
});

const PORT: number = parseInt(process.env.PORT as string) || 3000;
const DATABASE_URL = process.env.DATABASE_URL as string;

fastify.register(fastifyListRoutes, { colors: true });

/**
 * Register Clerk only for a subset of your routes
 */
const protectedRoutes: FastifyPluginCallback = (instance, opts, done) => {
  instance.register(clerkPlugin);
  admin.registerRoutes(instance);
  user.registerRoutes(instance);
  endorsements.registerRoutes(instance);

  done();
};

const publicRoutes: FastifyPluginCallback = (instance, opts, done) => {
  instance.get("/hello-world", async (request, reply) => {
    return {
      message: "This is a public endpoint. Request /user to test the auth middleware",
    };
  });
  done();
};

const start = async () => {
  try {
    await initDB();
    await fastify.register(require("@fastify/postgres"), {
      connectionString: DATABASE_URL,
    });
    await fastify.register(cors, {
      // put your options here
      origin: "*",
    });

    await fastify.register(import("@fastify/rate-limit"), {
      max: 60,
      timeWindow: "1 minute",
    });
    /**
     * Register your routes as you normally would
     */
    fastify.register(protectedRoutes);
    fastify.register(publicRoutes);
    setInstance(fastify);
    await fastify.listen({ port: PORT });
    // console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    // fastify.log.error(err);
    process.exit(1);
  }
};

// Add global exception handler to return a 400 error if an error is thrown
fastify.setErrorHandler((error: any, request: any, reply: any) => {
  // Log error
  // const errorMessage = `\n${error.message}\n${error.stack}\n`;
  fastify.log.error(error.stack);
  if (error.statusCode === 429) {
    reply.code(429);
    error.message = "You hit the rate limit! Slow down please!";
  } else {
    reply.code(400);
  }
  reply.send({ error: error.message });
});

start();
