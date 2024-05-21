import { Request, Response } from "express";

export const onCancelController = (req: Request, res: Response) => {
	return res.json({
		message: {
			ack: {
				status: "ACK",
			},
		},
	});
};