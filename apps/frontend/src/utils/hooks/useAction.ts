import * as _ from "lodash";
import { useState } from "react";
import { B2B_SCENARIOS, SERVICES_SCENARIOS, NEXT_ACTION } from "openapi-specs/constants";

export const useAction = (domain: string) => {
	const [action, setAction] = useState<string>();
	const [logError, setLogError] = useState(false);
	const [scenarios, setScenarios] =
		useState<{ name: string; scenario?: string }[]>();
	const allScenarios =
		domain.toLowerCase() === "b2b" ? B2B_SCENARIOS : SERVICES_SCENARIOS;
	const detectAction = _.debounce((log: string) => {
		try {
			const parsedLog = JSON.parse(log);
			if (!parsedLog.context!.action) setLogError(true);
			const parsedAction = parsedLog.context.action;
			setAction(parsedAction);
			const scenarioKey = Object.keys(allScenarios).filter(
				(key) => key === NEXT_ACTION[parsedAction as keyof typeof NEXT_ACTION]
			)[0];
			if (scenarioKey) {
				setScenarios(allScenarios[scenarioKey as keyof typeof allScenarios]);
			} else {
				setScenarios([]);
			}

			setLogError(false);
		} catch (error) {
			// console.log("Error Occurred in LOG", error);
			setLogError(true);
			setAction(undefined);
		}
	}, 1500);
	return { action, logError, scenarios, detectAction };
};
