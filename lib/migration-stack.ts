import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  DatabaseInstanceFromSnapshot,
  IDatabaseInstance,
  SnapshotCredentials,
} from "aws-cdk-lib/aws-rds";
import { Domain } from "aws-cdk-lib/aws-opensearchservice";
import { Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import {
  CfnEndpoint,
  CfnReplicationInstance,
  CfnReplicationSubnetGroup,
} from "aws-cdk-lib/aws-dms";
import { Key } from "aws-cdk-lib/aws-kms";
import { redactMetadata } from "aws-cdk-lib/core/lib/metadata-resource";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

interface MigrationStackProps extends StackProps {
  vpc: Vpc;
  database: DatabaseInstanceFromSnapshot;
  openSearchDomain: Domain;
  databaseSG: SecurityGroup;
  jumpboxSG: SecurityGroup;
}

export class MigrationStack extends Stack {
  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);

    const { vpc, database: db } = props;

    const bucket = new Bucket(this, `dms-storage-bucket-${this.account}`, {
      bucketName: `dms-storage-bucket-${this.account}`,
      enforceSSL: true,
      versioned: true,
    });

    const dmsSG = new SecurityGroup(
      this,
      `dms-sg-${this.account}-${this.region}`,
      {
        vpc,
      }
    );

    dmsSG.addIngressRule(Peer.anyIpv4(), Port.HTTP, "http");
    dmsSG.addIngressRule(Peer.anyIpv4(), Port.HTTPS, "https");
    dmsSG.addIngressRule(Peer.anyIpv4(), Port.tcp(9200), "opensearch");
    dmsSG.addIngressRule(Peer.anyIpv4(), Port.tcp(5601), "kibana");
    dmsSG.addIngressRule(Peer.anyIpv4(), Port.tcp(5432), "postgres");

    const replicationSubnetGroup = new CfnReplicationSubnetGroup(
      this,
      `repl-subnet-gp-${this.account}`,
      {
        subnetIds: vpc.selectSubnets({
          subnetType: SubnetType.PUBLIC,
        }).subnetIds,
        replicationSubnetGroupDescription: "replication subnet group",
        replicationSubnetGroupIdentifier: "replication-subnet-gp-id",
      }
    );

    // dms replication instance
    const replicationInstance = new CfnReplicationInstance(
      this,
      `repl-inst-${this.account}-${this.region}`,
      {
        replicationInstanceClass: "dms.t3.medium",
        replicationInstanceIdentifier: `replication-inst-${this.account}`,
        allocatedStorage: 50,
        engineVersion: "3.6.1",
        multiAz: false,
        publiclyAccessible: true,
        vpcSecurityGroupIds: [props.databaseSG.securityGroupId],
        replicationSubnetGroupIdentifier:
          replicationSubnetGroup.replicationSubnetGroupIdentifier,
      }
    );

    Tags.of(replicationInstance).add(
      "Name",
      `replication-instance-${this.account}`
    );

    const secretsRole = new Role(this, `secrets-role-${this.account}`, {
      assumedBy: new ServicePrincipal("dms.amazonaws.com"),
    });

    secretsRole.addToPolicy(
      new PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [db.secret!.secretFullArn!],
      })
    );
    /*
    // postgres endpoint
    const pgEndpoint = new CfnEndpoint(
      this,
      `pgEndpoint-${this.account}-${this.region}`,
      {
        endpointType: "source",
        engineName: "postgres",
        port: 5432,
        databaseName: "mappappadmin",
        postgreSqlSettings: {
          secretsManagerAccessRoleArn: secretsRole.roleArn,
          secretsManagerSecretId: db.secret!.secretName,
        },
      }
    );

    props.databaseSG.addIngressRule(dmsSG, Port.tcp(5432), "postgres");
    */
  }
}
