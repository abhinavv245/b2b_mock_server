import { Request, Response } from "express";
import { B2B_SCENARIOS, SERVICES_SCENARIOS } from "openapi-specs/constants";

export const getAllScenarios = (req: Request, res: Response) => {
  const action = req.params["action"]
  const domain = req.params["domain"]
  let scenarios
  if(domain === "b2b") {
    scenarios = B2B_SCENARIOS[action as keyof typeof B2B_SCENARIOS]
    
  } else {
    scenarios = SERVICES_SCENARIOS[action as keyof typeof SERVICES_SCENARIOS]
  }
  return res.json({scenarios})
}