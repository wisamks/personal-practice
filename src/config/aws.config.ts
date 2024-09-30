import { RepositoryBadGatewayException } from "@_/common/custom-error.util";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import { Logger } from "@nestjs/common";

const loadParamsFromSsm = async (path: string): Promise<string> => {
    const logger = new Logger('awsConfig');

    const ssmClient = new SSMClient();
    const command = new GetParameterCommand({
        Name: path,
        WithDecryption: true,
    });

    try {
        const response = await ssmClient.send(command);
        return response.Parameter.Value;
    } catch(err) {
        logger.error(err);
        throw new RepositoryBadGatewayException(err.message);
    }
}

export default async (): Promise<any> => {
    const stage = process.argv[2];
    const env = await loadParamsFromSsm(`/Practice/practice/${stage}/env`);
    return JSON.parse(env);
}