import { LambdaIntegration, Resource } from '@aws-cdk/aws-apigateway';
import {
  Role, PolicyStatement, Effect,
  ServicePrincipal, PolicyDocument, ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Function } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct, Duration } from '@aws-cdk/core';

export interface CaRegistratorProps {
  activatorFunction: Function;
  activatorRole: Role;
  activatorQueueUrl: string;
  apiResource: Resource;
  verifiers?: [VerifierProps];
}

export interface VerifierProps {
  name: string;
  arn: string;
}

export class CaRegistrator extends NodejsFunction {
  constructor(scope: Construct, id: string, props: CaRegistratorProps) {
    let environment: {[key: string]: string} = {
      ACTIVATOR_ARN: props.activatorFunction.functionArn,
      ACTIVATOR_ROLE_ARN: props.activatorRole.roleArn,
      ACTIVATOR_QUEUE_URL: props.activatorQueueUrl,
    };
    props.verifiers?.forEach(verifier=> environment[verifier.name] = verifier.arn);

    super(scope, `CaRegistratorFunction-${id}`, {
      entry: `${process.env.APPS_PATH}/registerCA/index.js`,
      role: new CaRegistationRole(scope, id),
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: environment,
    });
    props.apiResource.addMethod('POST', new LambdaIntegration(this));
  }
}

class CaRegistationRole extends Role {
  constructor(scope: Construct, id:string) {
    super(scope, `CaRegistationRole-${id}`, {
      roleName: 'CaRegistrationRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        CaRegistrationPolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'lambda:CreateFunction',
              'iam:PassRole',
              'iot:RegisterCACertificate',
              'iot:TagResource',
              'iot:GetRegistrationCode',
              'iam:CreateRole',
              'iam:AttachRolePolicy',
              'iot:CreateTopicRule',
            ],
            resources: ['*'],
          })],
        }),
      },
    });
  }
}