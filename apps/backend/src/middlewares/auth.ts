import { NextFunction, Request, Response } from "express";
import { verifyHeader } from "../lib/utils/auth";
import { Locals } from "../interfaces";
import { B2B_BAP_MOCKSERVER_URL, logger } from "../lib/utils";

export const authValidatorMiddleware = async (
	req: Request,
	res: Response<{}, Locals>,
	next: NextFunction
) => {
	try {
		// if (req.originalUrl.includes("/auth")) {
		// 	next();
		// 	return;
		// }
		const mode = req.query.mode as string;
		// console.log("MODE", mode, ["sandbox", "mock"].includes(mode));
		// if (!mode || !["sandbox", "mock"].includes(mode))
		// 	return res.status(400).json({
		// 		message: {
		// 			ack: {
		// 				status: "NACK",
		// 			},
		// 		},
		// 		error: {
		// 			message: "Mode Not specified or Invalid",
		// 		},
		// 	});

		res.setHeader("mode", mode ? mode : "sandbox");

		if (
			mode === "mock" 
			||
			(req.body.context.bap_uri === B2B_BAP_MOCKSERVER_URL &&
				req.body.context.action === "search")
		) {
			next(); //skipping auth header validation in "mock" mode
			return;
		} else {
			// console.log("MODE:", mode);
			const auth_header = req.headers["authorization"] || "";
			// console.log(req.body?.context?.transaction_id, "headers", auth_header);

			var verified = await verifyHeader(auth_header, (req as any).rawBody.toString());

			if (!verified) {
				return res.status(401).json({
					message: {
						ack: {
							status: "NACK",
						},
					},
					error: {
						message: "Authentication failed",
					},
				});
			}
			next();
		}
	} catch (err) {
		logger.error(err)
		return res.status(401).json({
			message: {
				ack: {
					status: "NACK",
				},
			},
			error: {
				message: "Authentication failed",
			},
		});
	}
};
