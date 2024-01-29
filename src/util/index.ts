export const isEmpty = (obj: any) => {
  return !obj || obj.length === 0;
};

export const createRequestConfig = (maxRequestsPerMinute: number) => {
  return {
    config: {
      rateLimit: {
        max: maxRequestsPerMinute,
        timeWindow: "1 minute",
      },
    },
  };
};
