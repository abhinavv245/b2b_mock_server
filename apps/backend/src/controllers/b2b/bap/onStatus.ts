import { Request, Response } from "express";
import { logger } from "../../../lib/utils";

export const onStatusController = (req: Request, res: Response) => {
	logger.info({
		type: "response",
		action: "on_status",
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
