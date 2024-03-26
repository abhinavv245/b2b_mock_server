import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Handle, Position } from "reactflow";

export const NpNode = () => {
	return (
		<Paper sx={{ p: 1 }}>
			<Handle
				type="target"
				position={Position.Top}
				id="request"
				isConnectable={true}
				style={{ left: "30%" }}
			/>
			<Handle
				type="source"
				position={Position.Top}
				id="response"
				isConnectable={true}
				style={{ left: "70%" }}
			/>
			<Typography>NP</Typography>
		</Paper>
	);
};
