import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import { Logger } from "@nestjs/common";

const loadParamsFromSsm = async (path: string) => {
    const ssmClient = new SSMClient();
    const command = new GetParameterCommand({
        Name: path,
        WithDecryption: true,
    });

    try {
        const response = await ssmClient.send(command);
        const parameter = response.Parameter;
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
    const env = await loadParamsFromSsm('/Practice/practice/dev/env');
    return env;
}