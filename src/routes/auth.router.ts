import validationPipe from '@_/middlewares/validationPipe.middleware';
import { Router } from 'express';
import { CreateUserReqDto } from './reqDto/create-user.req.dto';
import { AuthController } from '@_/controllers/auth.controller';


const router = Router();

router.get('/', AuthController.getUsers);

router.get('/:userId', AuthController.getUser);

router.post('/sign-up', validationPipe(CreateUserReqDto), AuthController.createUser);

export default router;