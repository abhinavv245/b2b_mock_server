import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Handle, Position } from "reactflow";

export const MockServerNode = () => {
	return (
		<Paper sx={{ p: 1 }}>
			<Typography>Mock Server</Typography>
			<Handle
				type="source"
				position={Position.Bottom}
				id="request"
				isConnectable={true}
				style={{ left: "30%" }}
			/>
			<Handle
				type="target"
				position={Position.Bottom}
				id="response"
				isConnectable={true}
				style={{ left: "70%" }}
			/>
		</Paper>
	);
};
