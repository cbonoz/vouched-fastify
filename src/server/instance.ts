import fastifyPostgres from '@fastify/postgres';
import { FastifyInstance } from "fastify";

let instance: FastifyInstance
export const setInstance = (instanceToSet: FastifyInstance) => {
  instance = instanceToSet;
  return instance;
};

export const getInstance = () => {
  return instance;
};
