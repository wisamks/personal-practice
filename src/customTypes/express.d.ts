export interface ReqUser {
	userId: number;
}

declare global {
	namespace Express {
		interface Request {
			user?: ReqUser;
		}
	}
}