import validationPipe from '@_/middlewares/validationPipe.middleware';
import { Router } from 'express';
import { CreateUserReqDto } from './reqDto/create-user.req.dto';
import { AuthController } from '@_/controllers/auth.controller';
import { UpdateUserReqDto } from './reqDto/update-user.req.dto';
import { GetUsersReqDto } from './reqDto/get-users.req.dto';


const router = Router();

router.get('/', validationPipe(GetUsersReqDto), AuthController.getUsers);

router.get('/:userId', AuthController.getUser);

router.post('/sign-up', validationPipe(CreateUserReqDto), AuthController.createUser);

router.put('/:userId', validationPipe(UpdateUserReqDto), AuthController.updateUser);

router.delete('/:userId', AuthController.deleteUser);

export default router;