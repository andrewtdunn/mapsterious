import { NetworkStack } from "./network-stack";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatabaseStack } from "./database-stack";
import { ComputeStack } from "./compute-stack";
import { StorageStack } from "./storage-stack";
import { MigrationStack } from "./migration-stack";

export class MapsteriousStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const vpcStack = new NetworkStack(this, `Network-Stack-${this.account}`, {
      env: props?.env,
      description: "Contains custom VPC.",
    });

    const computeStack = new ComputeStack(
      this,
      `Compute-Stack-${this.account}`,
      {
        vpc: vpcStack.vpc,
        env: props?.env,
        description: "Contains Jumpbox and security groups.",
      }
    );

    const dbStack = new DatabaseStack(this, `Database-Stack-${this.account}`, {
      vpc: vpcStack.vpc,
      env: props?.env,
      jumpboxSG: computeStack.jumpboxSG,
      description: "Contains database and security groups.",
    });

    const storageStack = new StorageStack(
      this,
      `Storage-Stack-${this.account}`,
      {
        vpc: vpcStack.vpc,
        env: props?.env,
        description: "Contains opensearch domain and DMS storage bucket.",
      }
    );

    const migrationStack = new MigrationStack(
      this,
      `MigrationStack-${this.account}`,
      {
        vpc: vpcStack.vpc,
        database: dbStack.db,
        jumpboxSG: computeStack.jumpboxSG,
        description: "Contains DMS instance and migration task.",
        openSearchDomain: storageStack.openSearchDomain,
        databaseSG: dbStack.dbSG,
      }
    );
  }
}
