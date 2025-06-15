import { NetworkStack } from "./network-stack";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class MapsteriousStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const vpcStack = new NetworkStack(this, `Network-Stack-${this.account}`, {
      env: props?.env,
    });
  }
}
