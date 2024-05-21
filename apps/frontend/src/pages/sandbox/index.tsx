import Container from "@mui/material/Container";
import { SandboxProvider } from "../../utils/context";
import { Outlet } from "react-router-dom";
import { MessageDialog } from "../../components";

export const Sandbox = () => {
	return (
		<SandboxProvider>
			<Container sx={{ py: 2 }}>
				<Outlet />
				<MessageDialog />
			</Container>
		</SandboxProvider>
	);
};
