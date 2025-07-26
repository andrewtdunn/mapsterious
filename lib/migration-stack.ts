import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  IDatabaseInstance,
  SnapshotCredentials,
} from "aws-cdk-lib/aws-rds";
import { Domain } from "aws-cdk-lib/aws-opensearchservice";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

interface MigrationStackProps extends StackProps {
  vpc: Vpc;
  database: IDatabaseInstance;
  openSearchDomain: Domain;
  databaseSG: SecurityGroup;
  credentials: SnapshotCredentials;
  jumpboxSG: SecurityGroup;
}

export class MigrationStack extends Stack {
  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);
  }
}
