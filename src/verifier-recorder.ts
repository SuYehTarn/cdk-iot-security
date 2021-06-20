import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export class VerifierRecorder extends Construct {
  public readonly getAllVerifierFunction: lambda.Function;
  public readonly getAllVerifierHttpFunction: lambda.Function;
  public readonly getOneVerifierHttpFunction: lambda.Function;
  public readonly writeOneVerifierHttpFunction: lambda.Function;
  public readonly deleteOneVerifierHttpFunction: lambda.Function;
  constructor(scope: Construct, id: string, props?: VerifierRecorder.Props) {
    super(scope, `VerifierRecorder-${id}`);
    this.getAllVerifierFunction = new GetAllVerifierFunction(this, id, props?.verifiers);
    this.getAllVerifierHttpFunction = new GetAllVerifierHttpFunction(this, id, this.getAllVerifierFunction);
    this.getOneVerifierHttpFunction = new GetOneVerifierHttpFunction(this, id, this.getAllVerifierFunction);
    this.writeOneVerifierHttpFunction = new WriteOneVerifierHttpFunction(this, id, this.getAllVerifierFunction);
    this.deleteOneVerifierHttpFunction = new DeleteOneVerifierHttpFunction(this, id, this.getAllVerifierFunction);
  }
}

export module VerifierRecorder {
  export interface Props {
    verifiers?: [VerifierProps];
  }
  export interface VerifierProps {
    /**
       * The verifier name.
       */
    name: string;
    /**
       * The verifier Lambda Function
       */
    lambdaFunction: lambda.Function;
  }
}

class GetAllVerifierFunction extends lambda.Function {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: [VerifierRecorder.VerifierProps]) {
    const environment: {[key: string]: string} = verifiers? { verifiers: JSON.stringify(verifiers) } : {};
    super(scope, `GetAllVerifierFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-all')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: environment,
    });
  }
}

class GetAllVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function accepting HTTP requests and returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `GetAllVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-all-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}
class GetOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the parameter in a form like '/{verifierName}',
   * and return the specified verifier information.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `GetOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}

class WriteOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the HTTP POST request, extract information in a format of
   * { "verifierName": "...", "verifierArn": "..." }, and write the information into the
   * original environment variable. It can either create or update a verifier.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `WriteOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/write-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}

class DeleteOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the parameter in a form like '/{verifierName}',
   * and delete the specified verifier.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `DeleteOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/delete-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}