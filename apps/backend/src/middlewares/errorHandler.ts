import { NextFunction, Request, Response, Router } from "express";
import { logger } from "../lib/utils";
import { AxiosError } from "axios";

export const globalErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
	logger.error(`Error occured: ${err.stack}`);
	return res.status(500).send({
		message: {
			ack: {
				status: "NACK",
			},
		},
		error: {
			message: err instanceof AxiosError ? err.response : err.message,
		},
	});
}

export const errorHandlingWrapper = (router: Router) => (req: Request, res: Response, next: NextFunction) => {
  try {
    router(req, res, next)
  } catch (error) {
    return next(error)
  }
}