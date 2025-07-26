import { aws_kms, CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstanceEngine,
  DatabaseInstanceFromSnapshot,
  IDatabaseInstance,
  PostgresEngineVersion,
  SnapshotCredentials,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";

interface dbProps extends StackProps {
  vpc: Vpc;
  jumpboxSG: SecurityGroup;
}

const engine = DatabaseInstanceEngine.postgres({
  version: PostgresEngineVersion.VER_11,
});

const snapshotIdentifier =
  "arn:aws:rds:us-east-1:742383987475:snapshot:finalsnapshot-111023";
const existingUsername = "mapappadmin";

export class DatabaseStack extends Stack {
  readonly db: IDatabaseInstance;
  readonly dbSG: SecurityGroup;
  readonly dbCredentials: SnapshotCredentials;

  constructor(scope: Construct, id: string, props: dbProps) {
    super(scope, id, props);

    const kmsKey = new aws_kms.Key(this, `mapsterious-kms-key-${this.account}`);

    this.dbCredentials = SnapshotCredentials.fromGeneratedSecret(
      existingUsername,
      { encryptionKey: kmsKey, excludeCharacters: "!&*^#@()" }
    );

    this.dbSG = new SecurityGroup(this, `mapsterious-db-sg-${this.account}`, {
      vpc: props!.vpc,
      allowAllOutbound: true,
      description: "Mapsterious Database Security Group",
      securityGroupName: `mapsterious-db-sg-${this.account}`,
    });

    this.dbSG.connections.allowFrom(
      Peer.securityGroupId(props.jumpboxSG.securityGroupId),
      Port.tcp(5432),
      "Allow DB access from jumpbox"
    );

    this.db = new DatabaseInstanceFromSnapshot(
      this,
      `mapsterious-db-${this.account}`,
      {
        engine,
        vpc: props!.vpc,
        securityGroups: [this.dbSG],
        snapshotIdentifier,
        credentials: this.dbCredentials,
        instanceType: InstanceType.of(
          InstanceClass.BURSTABLE3,
          InstanceSize.MICRO
        ),
        allowMajorVersionUpgrade: true,
      }
    );

    new CfnOutput(this, `db-endpoint-${this.account}`, {
      value: this.db.dbInstanceEndpointAddress,
    });
  }
}
