import { aws_kms, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstanceEngine,
  DatabaseInstanceFromSnapshot,
  PostgresEngineVersion,
  SnapshotCredentials,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface dbProps extends StackProps {
  vpc: Vpc;
}

const engine = DatabaseInstanceEngine.postgres({
  version: PostgresEngineVersion.VER_11,
});

const existingUsername = "mapappadmin";

const snapshotIdentifier =
  "arn:aws:rds:us-east-1:742383987475:snapshot:finalsnapshot-111023";

export class DatabaseStack extends Stack {
  constructor(scope: Construct, id: string, props?: dbProps) {
    super(scope, id, props);

    const kmsKey = new aws_kms.Key(this, `mapsterious-kms-key-${this.account}`);

    const db = new DatabaseInstanceFromSnapshot(
      this,
      `mapsterious-db-${this.account}`,
      {
        engine,
        vpc: props!.vpc,
        snapshotIdentifier,
        credentials: SnapshotCredentials.fromGeneratedSecret(existingUsername, {
          encryptionKey: kmsKey,
          excludeCharacters: "!&*^#@()",
        }),
        instanceType: InstanceType.of(
          InstanceClass.MEMORY5,
          InstanceSize.LARGE
        ),
        allowMajorVersionUpgrade: true,
      }
    );

    new CfnOutput(this, `db-endpoint-${this.account}`, {
      value: db.dbInstanceEndpointAddress,
    });
  }
}
