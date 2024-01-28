import fastify from "fastify";
import { PostgresDb } from "@fastify/postgres";

export const fastifyPg: PostgresDb = (fastify as any).pg as PostgresDb;
