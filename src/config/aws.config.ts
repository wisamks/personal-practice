import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { GetParametersByPathCommand, SSMClient } from "@aws-sdk/client-ssm"
import { Logger } from "@nestjs/common";

const loadParamsFromSsm = async (path: string) => {
    const ssmClient = new SSMClient({ 
        region: 'ap-northeast-2',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }, 
    });
    const command = new GetParametersByPathCommand({
        Path: path,
        Recursive: true,
        WithDecryption: true,
    });

    try {
        const response = await ssmClient.send(command);
        const parameters = response.Parameters;
        const parameter = parameters.filter(x => x.Name === '/Practice/practice/dev/env')[0];
        if (!parameter) {
            throw new RepositoryBadGatewayException('파라미터 스토어에서 환경변수를 못 찾았습니다.\nawsConfig 파일을 다시 한 번 확인해주세요.'); 
        };
        return JSON.parse(parameter.Value);
    } catch(err) {
        const logger = new Logger('awsConfig');
        logger.error(err);
        throw new RepositoryBadGatewayException(err.message);
    }
}

export default async () => {
    const env = await loadParamsFromSsm('/Practice/practice/dev');
    return env;
}