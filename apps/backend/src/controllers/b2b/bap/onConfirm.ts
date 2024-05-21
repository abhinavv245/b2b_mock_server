import { Request, Response } from "express";
import { logger } from "../../../lib/utils";

export const onConfirmController = (req: Request, res: Response) => {
	logger.info({
		type: "response",
		action: "on_confirm",
		transaction_id: req.body.context.transaction_id,
		message: { sync: { message: { ack: { status: "ACK" } } } },
	});
	return res.json({
		message: {
			ack: {
				status: "ACK",
			},
		},
	});
};
