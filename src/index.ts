import "./loadEnv";

import Fastify, { FastifyPluginCallback } from "fastify";
import { clerkClient, clerkPlugin, getAuth } from "@clerk/fastify";
import admin from "./routes/admin";
import user from "./routes/user";
import endorsements from "./routes/endorsements";
import fastifyPg from "@fastify/postgres";
import cors from "@fastify/cors";

import { initDB } from "./db";

const fastify = Fastify({ logger: true });

const PORT: number = parseInt(process.env.PORT as string) || 3000;
const DATABASE_URL = process.env.DATABASE_URL as string;

fastify.register(fastifyPg, {
  connectionString: DATABASE_URL,
});

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
  instance.get("/", async (request, reply) => {
    return {
      message: "This is a public endpoint. Request /user to test the auth middleware",
    };
  });
  done();
};

/**
 * Register your routes as you normally would
 */
fastify.register(protectedRoutes);
fastify.register(publicRoutes);

const start = async () => {
  try {
    await initDB();
    await fastify.register(cors, {
      // put your options here
      origin: "*",
    });
    await fastify.listen({ port: PORT });
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Add global exception handler to return a 400 error if an error is thrown
fastify.setErrorHandler((error, request, reply) => {
  reply.code(400).send({ error: error.message });
});

start();
